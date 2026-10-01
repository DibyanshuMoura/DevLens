// Must be first: ESM evaluates imports before module bodies, so env vars
// have to load during import — not later via dotenv.config().
import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { PDFParse } from "pdf-parse";
import authRouter from "./auth.js";
import { appendSnapshot } from "./history.js";
import { connectDB } from "./db.js";
import { fetchGitHubData } from "./github.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(cors());

app.use("/auth", authRouter);

// Keep uploads in memory only — nothing is written to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

const MAX_RESUME_CHARS = 6000;

const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

/** Parse LLM output even when it arrives fenced or wrapped in prose. */
function parseJsonLoose(text) {
  let t = String(text).trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  try {
    return JSON.parse(t);
  } catch {
    // Last resort: slice out the outermost {...} / [...] block.
    const start = t.search(/[{[]/);
    const end = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
    if (start !== -1 && end > start) {
      return JSON.parse(t.slice(start, end + 1));
    }
    throw new Error("AI returned invalid JSON");
  }
}

/**
 * Ask Groq for a JSON answer and return the parsed object.
 *
 * gpt-oss models occasionally fail json_object validation ("Failed to
 * validate JSON"), so: attempt 1 is strict JSON mode; attempt 2 retries the
 * same model without response_format; attempt 3 falls back to the smaller
 * model that reliably honors json mode.
 */
async function callGroqJson(prompt, { temperature = 0.4 } = {}) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("Groq API key is missing");
  }
  const attempts = [
    { model: DEFAULT_GROQ_MODEL, jsonMode: true },
    { model: DEFAULT_GROQ_MODEL, jsonMode: false },
    { model: "openai/gpt-oss-20b", jsonMode: true },
  ];
  let lastError = new Error("LLM request failed");

  for (const attempt of attempts) {
    let content = prompt;
    if (!attempt.jsonMode) {
      content +=
        "\n\nIMPORTANT: Respond with ONLY the raw JSON object — no markdown fences, no commentary.";
    }
    const body = {
      model: attempt.model,
      temperature,
      messages: [{ role: "user", content }],
    };
    if (attempt.jsonMode) body.response_format = { type: "json_object" };

    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        lastError = new Error(err.error?.message || "LLM request failed");
        if (response.status === 401 || response.status === 403) throw lastError;
        continue;
      }
      const text = (await response.json())?.choices?.[0]?.message?.content;
      if (!text) {
        lastError = new Error("Invalid AI response");
        continue;
      }
      return parseJsonLoose(text);
    } catch (err) {
      lastError = err;
      if (err.message === "Groq API key is missing") throw err;
    }
  }
  throw lastError;
}

async function extractResumeText(file) {
  const parser = new PDFParse({ data: file.buffer });
  try {
    const result = await parser.getText();
    // Collapse whitespace and drop pdf-parse's "-- 1 of 3 --" page markers
    // so the LLM prompt stays compact and readable.
    return result.text
      .replace(/--\s*\d+\s*of\s*\d+\s*--/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_RESUME_CHARS);
  } finally {
    await parser.destroy();
  }
}

function buildPrompt(userData, resumeText, jobRole) {
  const resumeSection = resumeText
    ? `
  Candidate Resume (text extracted from uploaded PDF):
  """
  ${resumeText}
  """

  Use the resume for additional context about the candidate's skills,
  projects, and experience. Combine it with the GitHub data, and keep
  every point factual — do not invent anything that is not supported by
  the GitHub data or the resume. Fill "resumeMatch" with 3 short points
  about where the resume and GitHub activity agree or contradict each other.
  `
    : "";

  const roleSection = jobRole
    ? `
  Target Job Role: ${jobRole}

  The candidate is applying for this specific role. Evaluate the profile
  against what employers typically look for in that role. For "roleFit":
  - "score": integer 0-100, how ready this profile is for the role
  - "summary": one sentence on overall fit for the role
  - "strengths": exactly 3 short points where the GitHub profile supports the role
  - "gaps": exactly 3 short points — concrete things present in the GitHub
    profile and resume but MISSING from the candidate's current resume
    (e.g. an unstated project, an unlisted skill, a repo-worthy achievement
    they should add), or small role-relevant weaknesses to fix. Each point
    must be phrased as something actionable for the resume.
  When no resume is provided, base "gaps" on what the GitHub data shows
  that a resume should mention.
  `
    : "";

  const roleFitRules = jobRole
    ? `  - "roleFit": object for the target role — {"score": 0-100 integer,
      "summary": one sentence on fit, "strengths": 3 short points where the
      GitHub profile supports the role, "gaps": 3 short points describing
      concrete things visible in the GitHub profile and resume that are
      MISSING from the resume (an unstated project, an unlisted skill, a
      repo-worthy achievement), phrased as resume-ready additions
`
    : "  - Omit the roleFit field entirely unless a target job role is provided\n";

  const roleFitExample = jobRole
    ? `    "roleFit": {
      "score": 80,
      "summary": "sentence",
      "strengths": ["point", "point", "point"],
      "gaps": ["point", "point", "point"]
    }
`
    : "";

  return `
  You are a senior engineering recruiter and GitHub profile analyzer.

  Analyze the following GitHub statistics and generate a concise evaluation.

  GitHub Data:
  ${JSON.stringify(userData)}
  ${resumeSection}
${roleSection}
  STRICT RULES:
  - Return ONLY valid JSON
  - Do not include markdown
  - Do not include explanation text
  - Do not wrap response in backticks
  - Do not add intro or outro
  - Keep responses factual based ONLY on provided data
  - Do not hallucinate technologies, experience, or achievements

  Field rules:
  - "summary": one or two plain sentences describing this developer
  - "score": integer 0-100 rating overall profile strength
  - "skills": array of up to 6 concrete technologies evident from the data
  - "activity": exactly 3 objects, each {"title": short label, "detail": one sentence}
  - "strengths", "weaknesses", "improvements": each exactly 3 short bullet points
  - "resumeMatch": 3 short bullet points when a resume is provided, otherwise []
  - "quote": ONE line (max ~90 characters) that captures this developer's
    spirit — either a real famous quote about building/craft/perseverance
    with its author as "text" — "Author", or an original line written in
    the same style. No emojis, no hashtags.
${roleFitRules}
  Expected JSON format:

  {
    "summary": "sentence",
    "score": 75,
    "skills": ["skill", "skill"],
    "activity": [
      { "title": "label", "detail": "sentence" },
      { "title": "label", "detail": "sentence" },
      { "title": "label", "detail": "sentence" }
    ],
    "strengths": [
      "point",
      "point",
      "point"
    ],
    "weaknesses": [
      "point",
      "point",
      "point"
    ],
    "improvements": [
      "point",
      "point",
      "point"
    ],
    "resumeMatch": [
      "point",
      "point",
      "point"
    ],
    "quote": "Talk is cheap. Show me the code. — Linus Torvalds"${jobRole ? `,` : ""}
${jobRole ? roleFitExample : ""}  }
  `;
}

const JOB_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Mobile App Developer",
  "DevOps Engineer",
  "Data Analyst",
  "Data Scientist",
  "Machine Learning Engineer",
  "AI Engineer",
  "Software Engineer",
  "Software Development Engineer (SDE)",
  "Cloud Engineer",
  "Cybersecurity Analyst",
  "Game Developer",
  "UI/UX Engineer",
  "QA / Test Automation Engineer",
  "Blockchain Developer",
  "Database Administrator",
  "Site Reliability Engineer (SRE)",
  "Technical Writer",
];

// Job role list for the frontend dropdown.
app.get("/roles", (_req, res) => {
  res.json({ roles: JOB_ROLES });
});

async function analyzeProfile(req, res, username, resumeText, jobRole) {
  try {
    const gh = await fetchGitHubData(username);
    const user = gh.user;
    const ranked = gh.ranked;
    const stars = gh.stars;
    const forks = gh.forks;
    const active = gh.active;
    const accountAgeYears = gh.accountAgeYears;
    const userData = gh.userData;

    const prompt = buildPrompt(userData, resumeText, jobRole);
    const parsed = await callGroqJson(prompt);

    // The quote is cosmetic (profile-card only) — if the model skipped it,
    // fall back to a deterministic pick so the card always has one.
    if (!parsed.quote || typeof parsed.quote !== "string") {
      const QUOTE_FALLBACKS = [
        "Talk is cheap. Show me the code. — Linus Torvalds",
        "Simplicity is the soul of efficiency. — Austin Freeman",
        "First, solve the problem. Then, write the code. — John Johnson",
        "Make it work, make it right, make it fast. — Kent Beck",
        "Programming isn't about what you know; it's about what you can figure out. — Chris Pine",
        "The best way to predict the future is to invent it. — Alan Kay",
      ];
      parsed.quote =
        QUOTE_FALLBACKS[userData.username.length % QUOTE_FALLBACKS.length];
    }
    // Snapshot for the signed-in user's history/comparison view.
    // The JWT is verified defensively — analysis still succeeds for
    // anonymous users even if the session is expired or absent.
    let signedInUser = null;
    try {
      const header = req.headers.authorization || "";
      const token = header.startsWith("Bearer ") ? header.slice(7) : null;
      if (token && process.env.JWT_SECRET) {
        signedInUser = jwt.verify(token, process.env.JWT_SECRET);
      }
    } catch {
      signedInUser = null;
    }

    if (signedInUser) {
      try {
        await appendSnapshot(signedInUser, {
          username: userData.username,
          score: parsed.score,
          repos: userData.repos,
          followers: user.followers,
          stars,
          forks,
          activeRepos: active,
          skills: parsed.skills || [],
        });
      } catch (err) {
        console.error("Snapshot failed:", err.message);
      }
    }

    res.status(200).json({
      dp: user.avatar_url,
      name: user.login,
      id: user.html_url,
      res: parsed,
      hasResume: Boolean(resumeText),
      role: jobRole || null,
      stats: {
        repos: user.public_repos,
        followers: user.followers,
        stars,
        forks,
        activeRepos: active,
        accountAgeYears,
        languages: userData.languages,
        topRepos: ranked.slice(0, 5).map((r) => ({
          name: r.name,
          stars: r.stargazers_count,
          language: r.language,
          url: r.html_url,
        })),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
}

// When OAuth is configured the analyzer is members-only. Without OAuth
// credentials the endpoint stays open (self-host / demo friendly).
function requireSignedIn(req, res, next) {
  const authReady = Boolean(
    process.env.GITHUB_CLIENT_ID &&
      process.env.GITHUB_CLIENT_SECRET &&
      process.env.JWT_SECRET,
  );
  if (!authReady) return next();

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res
      .status(401)
      .json({ message: "Sign in with GitHub to analyze profiles" });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res
      .status(401)
      .json({ message: "Session expired — sign in again" });
  }
}

app.get("/analyze", requireSignedIn, (req, res) => {
  const username = req.query.username;
  if (!username) {
    return res.status(400).json({ message: "Username is required" });
  }
  const role = JOB_ROLES.find(
    (r) => r.toLowerCase() === String(req.query.role || "").trim().toLowerCase(),
  );
  analyzeProfile(req, res, username, "", role || null);
});

app.post("/analyze", requireSignedIn, upload.single("resume"), async (req, res) => {
  // Signed-in users don't type a username — default to their own login
  // from the verified JWT.
  const username = (req.body?.username || req.user?.login || "").trim();
  if (!username) {
    return res.status(400).json({ message: "Username is required" });
  }
  const role = JOB_ROLES.find(
    (r) => r.toLowerCase() === String(req.body?.role || "").trim().toLowerCase(),
  );

  let resumeText = "";
  if (req.file) {
    try {
      resumeText = await extractResumeText(req.file);
    } catch (error) {
      console.error("Resume extraction failed:", error.message);
      return res.status(400).json({
        message: "Could not read the PDF. Is it a valid resume file?",
      });
    }
  }

  analyzeProfile(req, res, username.trim(), resumeText, role || null);
});

// Multer errors (file too large, wrong type, etc.) land here as JSON.
app.use((err, _req, res, _next) => {
  res.status(400).json({
    message: err.message || "Upload failed",
  });
});

try {
  await connectDB();
} catch (err) {
  console.error("Failed to connect to MongoDB:", err.message);
  process.exit(1);
}

app.listen(port);
