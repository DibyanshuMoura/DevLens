import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { getHistory, clearHistory } from "./history.js";
import { User } from "./models/User.js";

const router = express.Router();

const CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
const TOKEN_TTL = "7d";
const JWT_SECRET = process.env.JWT_SECRET || "";

export function normalizeOrigin(value, fallback) {
  const raw = String(value || fallback).trim().replace(/\/+$/, "");
  const explicitScheme = /^https?:\/\//i.exec(raw);
  const host = explicitScheme ? raw.slice(explicitScheme[0].length) : raw;

  const isLocalHost = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host);
  if (isLocalHost) return `http://${host}`;

  return `https://${host}`;
}

const APP_URL = normalizeOrigin(
  process.env.APP_URL,
  `localhost:${process.env.PORT || 3000}`,
);
const IS_HTTPS = APP_URL.startsWith("https://");
const FRONTEND_URL = normalizeOrigin(
  process.env.FRONTEND_URL,
  "localhost:5173",
);

function authConfigured() {
  return Boolean(CLIENT_ID && CLIENT_SECRET && JWT_SECRET);
}

function readBearerToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

function verifySession(req) {
  const token = readBearerToken(req);
  if (!token) return { ok: false, reason: "missing" };
  try {
    return { ok: true, user: jwt.verify(token, JWT_SECRET) };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

export function requireAuth(req, res, next) {
  if (!authConfigured()) {
    return res.status(503).json({ message: "Login is not configured" });
  }
  const session = verifySession(req);
  if (!session.ok) {
    return res
      .status(401)
      .json({
        message:
          session.reason === "missing"
            ? "Not signed in"
            : "Session expired — sign in again",
      });
  }
  req.user = session.user;
  next();
}

export function requireSignedIn(req, res, next) {
  if (!authConfigured()) return next();
  const session = verifySession(req);
  if (!session.ok) {
    return res
      .status(401)
      .json({
        message:
          session.reason === "missing"
            ? "Sign in with GitHub to analyze profiles"
            : "Session expired — sign in again",
      });
  }
  req.user = session.user;
  next();
}

router.get("/config", (_req, res) => {
  res.json({
    enabled: authConfigured(),
    provider: "github",
    clientId: authConfigured() ? CLIENT_ID : null,
  });
});

router.get("/github", (req, res) => {
  if (!authConfigured()) {
    return res.redirect(`${FRONTEND_URL}/?authError=${encodeURIComponent("Login is not configured")}`);
  }
  const state = crypto.randomBytes(16).toString("hex");
  res.cookie("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_HTTPS,
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

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.get("/history", requireAuth, async (req, res) => {
  try {
    const snapshots = await getHistory(req.user);
    res.json({ snapshots });
  } catch (err) {
    console.error("History error:", err.message);
    res.status(500).json({ message: "Failed to load history" });
  }
});

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
