import test from "node:test";
import assert from "node:assert/strict";

const { normalizeOrigin } = await import("../auth.js");

test("normalizeOrigin forces https for public hosts", () => {
  assert.equal(
    normalizeOrigin("http://devlensai.vercel.app", "localhost:5173"),
    "https://devlensai.vercel.app",
  );
  assert.equal(
    normalizeOrigin("devlensai.vercel.app", "localhost:5173"),
    "https://devlensai.vercel.app",
  );
  assert.equal(
    normalizeOrigin("https://devlensai.vercel.app", "localhost:5173"),
    "https://devlensai.vercel.app",
  );
  assert.equal(
    normalizeOrigin("http://devlens-sd03.onrender.com", "localhost:5173"),
    "https://devlens-sd03.onrender.com",
  );
});

test("normalizeOrigin keeps localhost on http", () => {
  assert.equal(normalizeOrigin("http://localhost:5173"), "http://localhost:5173");
  assert.equal(normalizeOrigin("localhost:3000"), "http://localhost:3000");
  assert.equal(normalizeOrigin("127.0.0.1:8080"), "http://127.0.0.1:8080");
  assert.equal(normalizeOrigin("https://localhost:5173"), "http://localhost:5173");
});

test("normalizeOrigin falls back when unset or blank", () => {
  assert.equal(normalizeOrigin(undefined, "localhost:5173"), "http://localhost:5173");
  assert.equal(normalizeOrigin("", "localhost:5173"), "http://localhost:5173");
});

test("normalizeOrigin tolerates whitespace and trailing slashes", () => {
  assert.equal(normalizeOrigin("  https://x.dev//  "), "https://x.dev");
  assert.equal(normalizeOrigin("https://x.dev/"), "https://x.dev");
});