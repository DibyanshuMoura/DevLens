import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { getHistory, clearHistory } from "./history.js";
import { User } from "./models/User.js";

const router = express.Router();

const CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
const APP_URL =
  process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET || "";
const TOKEN_TTL = "7d";

function authConfigured() {
  return Boolean(CLIENT_ID && CLIENT_SECRET && JWT_SECRET);
}

function requireAuth(req, res, next) {
  if (!authConfigured()) {
    return res.status(503).json({ message: "Login is not configured" });
  }
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: "Not signed in" });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Session expired — sign in again" });
  }
}

/** Frontend asks this first so the UI can hide/show the login button. */
router.get("/config", (_req, res) => {
  res.json({
    enabled: authConfigured(),
    provider: "github",
    clientId: authConfigured() ? CLIENT_ID : null,
  });
});

/** Step 1: send the browser to GitHub's authorize page. */
router.get("/github", (req, res) => {
  if (!authConfigured()) {
    return res.redirect(`${FRONTEND_URL}/?authError=${encodeURIComponent("Login is not configured")}`);
  }
  const state = crypto.randomBytes(16).toString("hex");
  res.cookie("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
  });
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: `${APP_URL}/auth/github/callback`,
    scope: "read:user",
    state,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

/** Step 2: GitHub calls back with a code; swap it for a user. */
router.get("/github/callback", async (req, res) => {
  const { code, state } = req.query;
  try {
    if (!code || !state || state !== req.cookies.oauth_state) {
      throw new Error("Invalid OAuth state");
    }
    res.clearCookie("oauth_state");

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: `${APP_URL}/auth/github/callback`,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new Error(tokenData.error_description || "Token exchange failed");
    }

    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github+json",
      },
    });
    if (!userRes.ok) {
      throw new Error("Failed to fetch GitHub user");
    }
    const ghUser = await userRes.json();

    // Persist the account (source of truth lives in MongoDB, not the JWT).
    await User.findOneAndUpdate(
      { githubId: ghUser.id },
      {
        $set: {
          login: ghUser.login,
          avatar: ghUser.avatar_url,
          profile: ghUser.html_url,
          lastLoginAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );

    const token = jwt.sign(
      {
        login: ghUser.login,
        githubId: ghUser.id,
        avatar: ghUser.avatar_url,
        profile: ghUser.html_url,
      },
      JWT_SECRET,
      { expiresIn: TOKEN_TTL },
    );

    res.redirect(
      `${FRONTEND_URL}/?token=${encodeURIComponent(token)}`,
    );
  } catch (err) {
    console.error("OAuth error:", err.message);
    res.redirect(
      `${FRONTEND_URL}/?authError=${encodeURIComponent(err.message)}`,
    );
  }
});

/** Who am I? Used to revalidate a stored token on page load. */
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

/** Analysis history for the signed-in user. */
router.get("/history", requireAuth, async (req, res) => {
  try {
    const snapshots = await getHistory(req.user);
    res.json({ snapshots });
  } catch (err) {
    console.error("History error:", err.message);
    res.status(500).json({ message: "Failed to load history" });
  }
});

/** Wipe all snapshots for the signed-in user. */
router.delete("/history", requireAuth, async (req, res) => {
  try {
    const cleared = await clearHistory(req.user);
    res.json({ cleared });
  } catch (err) {
    console.error("Clear history error:", err.message);
    res.status(500).json({ message: "Failed to clear history" });
  }
});

export default router;
