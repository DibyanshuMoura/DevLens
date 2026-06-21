import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.get("/analyze", async (req, res) => {
  try {
    const username = req.query.username;
    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }
    const resp = await fetch(`https://api.github.com/users/${username}`);
    if (!resp.ok) {
      return res.status(404).json({
        message: "GitHub user not found",
      });
    }
    const user = await resp.json();
    const reposRes = await fetch(user.repos_url);
    if (!reposRes.ok) {
      throw new Error("Failed to fetch repositories");
    }
    const repos = await reposRes.json();

    let stars = 0,
      langs = {},
      active = 0;

    repos.forEach((r) => {
      stars += r.stargazers_count;
      if (r.language) langs[r.language] = (langs[r.language] || 0) + 1;
      if (new Date() - new Date(r.updated_at) < 30 * 86400000) active++;
    });

    const userData = {
      username: user.login,
      repos: user.public_repos,
      followers: user.followers,
      stars,
      languages: Object.keys(langs).slice(0, 3),
      activeRepos: active,
    };

    const prompt = `
  You are a GitHub profile analyzer.

  Analyze the following GitHub statistics and generate a concise evaluation.

  GitHub Data:
  ${JSON.stringify(userData)}

  STRICT RULES:
  - Return ONLY valid JSON
  - Do not include markdown
  - Do not include explanation text
  - Do not wrap response in backticks
  - Do not add intro or outro
  - Every field must contain exactly 3 short bullet points
  - Keep responses factual based ONLY on provided data
  - Do not hallucinate technologies, experience, or achievements

  Expected JSON format:

  {
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
    ]
  }
  `;
    if (!process.env.GROQ_API_KEY) {
      throw new Error("Groq API key is missing");
    }
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          response_format: {
            type: "json_object",
          },
          messages: [{ role: "user", content: prompt }],
        }),
      },
    );
    if (!response.ok) {
      const err = await response.json();

      return res.status(response.status).json({
        message: err.error?.message || "LLM request failed",
      });
    }
    const data = await response.json();
    const text = data?.choices[0]?.message?.content;
    if (!text) {
      return res.status(500).json({
        message: "Invalid AI response",
      });
    }
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(500).json({
        message: "AI returned invalid JSON",
      });
    }
    res.status(200).json({
      dp: user.avatar_url,
      name: user.login,
      id: user.html_url,
      res: parsed,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
});

app.listen(port);
