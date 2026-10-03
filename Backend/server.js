import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import cookieParser from "cookie-parser";
import { PDFParse } from "pdf-parse";
import authRouter, { requireSignedIn } from "./auth.js";
import { appendSnapshot } from "./history.js";
import {
  saveAnalysis,
  getLatestAnalysis,
  isStale,
  toResponse,
} from "./analyses.js";
import { connectDB } from "./db.js";
import { fetchGitHubData } from "./github.js";
import { fetchCommitActivity, activityDigest } from "./activity.js";
import { assessRepoQuality, qualityDigest } from "./quality.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(cors());

app.use("/auth", authRouter);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
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
const ANALYSIS_MAX_AGE_MS = 60 * 60 * 1000;

const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

function parseJsonLoose(text) {
  let t = String(text).trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  try {
    return JSON.parse(t);
  } catch {
    const start = t.search(/[{[]/);
    const end = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
    if (start !== -1 && end > start) {
      return JSON.parse(t.slice(start, end + 1));
    }
    throw new Error("AI returned invalid JSON");
  }
}

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
    return result.text
      .replace(/--\s*\d+\s*of\s*\d+\s*--/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_RESUME_CHARS);
  } finally {
    await parser.destroy();
  }
}

function buildPrompt(userData, { resumeText, jobRole, activity, quality }) {
  const signals = {};
  const activityFacts = activityDigest(activity);
  const qualityFacts = qualityDigest(quality);
  if (activityFacts) signals.commitActivity = activityFacts;
  if (qualityFacts) signals.repoQuality = qualityFacts;

  const signalSection = Object.keys(signals).length
    ? `
  Verified Signals (computed by DevLens — treat as ground truth, do not
  re-estimate or contradict):
  ${JSON.stringify(signals)}

  Use these numbers verbatim in "activity" and "improvements" when relevant.
  Only describe public push activity as "public commits" — the data covers
  public pushes, not private work or full history.
  `
    : "";

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
${roleSection}${signalSection}
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
    - Prefer verified commit/streak signals over vague statements like
      "the developer is active" whenever the Verified Signals block is present
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

app.get("/roles", (_req, res) => {
  res.json({ roles: JOB_ROLES });
});

app.get("/activity", requireSignedIn, async (req, res) => {
  try {
    const gh = await fetchGitHubData(req.user.login);
    const activity = await fetchCommitActivity(req.user.login, gh.repos);
    res.json({ activity });
  } catch (error) {
    console.error("Activity error:", error.message);
    res.status(error.status || 500).json({
      message: error.message || "Could not load commit activity",
    });
  }
});

const QUOTE_FALLBACKS = [
  "Talk is cheap. Show me the code. — Linus Torvalds",
  "Simplicity is the soul of efficiency. — Austin Freeman",
  "First, solve the problem. Then, write the code. — John Johnson",
  "Make it work, make it right, make it fast. — Kent Beck",
  "Programming isn't about what you know; it's about what you can figure out. — Chris Pine",
  "The best way to predict the future is to invent it. — Alan Kay",
];

async function buildAnalysis(username, resumeText = "", jobRole = null) {
  const gh = await fetchGitHubData(username);
  const user = gh.user;
  const ranked = gh.ranked;
  const stars = gh.stars;
  const forks = gh.forks;
  const active = gh.active;
  const accountAgeYears = gh.accountAgeYears;
  const userData = gh.userData;

  const activity = await fetchCommitActivity(username, gh.repos);
  const quality = assessRepoQuality(gh.repos);
  const prompt = buildPrompt(userData, { resumeText, jobRole, activity, quality });
  const parsed = await callGroqJson(prompt);

  if (!parsed.quote || typeof parsed.quote !== "string") {
    parsed.quote =
      QUOTE_FALLBACKS[userData.username.length % QUOTE_FALLBACKS.length];
  }

  return {
    dp: user.avatar_url,
    name: user.login,
    id: user.html_url,
    res: parsed,
    hasResume: Boolean(resumeText),
    role: jobRole || null,
    activity,
    quality: quality || null,
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
  };
}

async function recordSnapshot(user, payload, activity, quality) {
  try {
    await appendSnapshot(user, {
      username: payload.name,
      score: payload.res?.score,
      repos: payload.stats?.repos,
      followers: payload.stats?.followers,
      stars: payload.stats?.stars,
      forks: payload.stats?.forks,
      activeRepos: payload.stats?.activeRepos,
      skills: payload.res?.skills || [],
      commits30: activity?.commits30 ?? null,
      longestStreak: activity?.longestStreak ?? null,
      hygieneScore: quality?.score ?? null,
    });
  } catch (err) {
    console.error("Snapshot failed:", err.message);
  }
}

async function analyzeProfile(req, res, username, resumeText, jobRole) {
  const signedInUser = req.user || null;
  try {
    const payload = await buildAnalysis(username, resumeText, jobRole);

    if (signedInUser) {
      await recordSnapshot(
        signedInUser,
        payload,
        payload.activity,
        payload.quality,
      );
      try {
        await saveAnalysis(signedInUser, payload);
      } catch (err) {
        console.error("Save analysis failed:", err.message);
      }
    }

    res.status(200).json({
      ...payload,
      cached: false,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);

    if ((error.status === 429 || error.status === 403) && signedInUser) {
      try {
        const doc = await getLatestAnalysis(signedInUser);
        if (doc) {
          return res.status(200).json({
            ...toResponse(doc, { cached: true }),
            notice:
              "GitHub's rate limit was reached, so this is your last saved analysis.",
          });
        }
      } catch (err) {
        console.error("Cached analysis fallback failed:", err.message);
      }
    }

    res.status(error.status || 500).json({
      message: error.message || "Internal server error",
    });
  }
}

function buildRoleFitPrompt(base, jobRole, resumeText) {
  const signals = {};
  const activityFacts = activityDigest(base.activity);
  const qualityFacts = qualityDigest(base.quality);
  if (activityFacts) signals.commitActivity = activityFacts;
  if (qualityFacts) signals.repoQuality = qualityFacts;

  const profile = {
    username: base.name,
    summary: base.res?.summary,
    score: base.res?.score,
    skills: base.res?.skills,
    strengths: base.res?.strengths,
    weaknesses: base.res?.weaknesses,
    improvements: base.res?.improvements,
    languages: base.stats?.languages,
    stats: base.stats,
    topRepos: base.stats?.topRepos,
    resumeMatch: base.res?.resumeMatch,
  };

  return `
  You are a senior engineering recruiter.

  A candidate has already had their GitHub profile analyzed. Your ONLY job is
  to judge that existing analysis against one specific target role.

  Target Job Role: ${jobRole}

  Existing Analysis:
  ${JSON.stringify(profile)}

  Verified Signals (computed by DevLens — treat as ground truth):
  ${JSON.stringify(signals)}

  ${resumeText ? `Candidate Resume (text extracted from an uploaded PDF):
  """
  ${resumeText}
  """

  Use the resume for context about stated skills, projects and experience.
  ` : "No resume was uploaded for this match."}

  STRICT RULES:
  - Return ONLY valid JSON, no markdown, no explanation, no backticks
  - Keep every point factual, based ONLY on the data above
  - Do not invent technologies, employers or achievements

  Field rules:
  - "score": integer 0-100, how ready this candidate is for the role
  - "summary": one sentence on overall fit for the role
  - "strengths": exactly 3 short points where the profile supports the role
  - "gaps": exactly 3 short points describing concrete things visible in the
    GitHub profile or resume that are MISSING from the candidate's resume
    (an unstated project, an unlisted skill, a repo-worthy achievement), each
    phrased as a resume-ready addition. With no resume uploaded, phrase gaps
    as what a resume for this role should mention.
  - "roadmap": exactly 6 items, ordered highest-impact first, each
    {"kind": "learn" | "build", "title": short label, "detail": one sentence,
    "skills": [up to 3 short skill or technology names]}
    Use "learn" for knowledge or tooling the candidate should pick up, and
    "build" for a concrete project they should create to prove it.
    Every project must be something a portfolio for this role would genuinely
    value, and must build on what the profile already suggests — never invent
    a technology the candidate has no connection to.

  Expected JSON format:
  {
    "score": 80,
    "summary": "sentence",
    "strengths": ["point", "point", "point"],
    "gaps": ["point", "point", "point"],
    "roadmap": [
      {
        "kind": "learn",
        "title": "short label",
        "detail": "one sentence",
        "skills": ["name", "name"]
      },
      {
        "kind": "build",
        "title": "short label",
        "detail": "one sentence",
        "skills": ["name", "name"]
      }
    ]
  }
  `;
}

app.get("/analysis", requireSignedIn, async (req, res) => {
  if (!req.user) return res.json({ analysis: null, needsAnalysis: true });
  try {
    const doc = await getLatestAnalysis(req.user);
    if (!doc) {
      return res.json({ analysis: null, needsAnalysis: true });
    }
    const stale = isStale(doc, ANALYSIS_MAX_AGE_MS);
    res.json({
      analysis: toResponse(doc, { cached: true, stale }),
      needsAnalysis: stale,
    });
  } catch (err) {
    console.error("Load analysis error:", err.message);
    res.status(500).json({ message: "Failed to load your analysis" });
  }
});

app.post(
  "/match",
  requireSignedIn,
  upload.single("resume"),
  async (req, res) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Sign in with GitHub to match roles" });
    }
    const role = JOB_ROLES.find(
      (r) =>
        r.toLowerCase() === String(req.body?.role || "").trim().toLowerCase(),
    );
    if (!role) {
      return res.status(400).json({ message: "Pick a target job role first" });
    }

    let base;
    try {
      base = toResponse(await getLatestAnalysis(req.user));
    } catch (err) {
      console.error("Load analysis for match failed:", err.message);
      return res.status(500).json({ message: "Failed to load your analysis" });
    }
    if (!base) {
      return res.status(409).json({
        message: "No analysis yet — wait for it to finish, then match a role.",
      });
    }

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

    try {
      const roleFit = await callGroqJson(
        buildRoleFitPrompt(base, role, resumeText),
        { temperature: 0.3 },
      );
      res.json({ role, roleFit, hasResume: Boolean(resumeText) });
    } catch (error) {
      console.error("Role match failed:", error.message);
      res.status(500).json({
        message: error.message || "Could not complete the match",
      });
    }
  },
);

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

app.use((err, _req, res, _next) => {
  /* Distinguish the upload failures a client can actually act on. Previously
     everything collapsed to 400 with multer's raw message. */
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      message: "That PDF is too large — please pick one under 5 MB.",
    });
  }
  if (err?.code === "LIMIT_UNEXPECTED_FILE" || /PDF/i.test(err?.message || "")) {
    return res.status(415).json({
      message: "Only PDF files are allowed.",
    });
  }
  console.error("Unhandled request error:", err?.message || err);
  res.status(500).json({
    message: err?.message || "Upload failed",
  });
});

try {
  await connectDB();
} catch (err) {
  console.error("Failed to connect to MongoDB:", err.message);
  process.exit(1);
}

app.listen(port);
