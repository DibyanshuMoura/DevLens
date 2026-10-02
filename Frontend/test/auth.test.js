import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

import { decodeJwtPayload } from "../src/lib/auth.js";

function b64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function makeToken(payload) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.randomBytes(16).toString("hex");
  return `${header}.${body}.${sig}`;
}

test("decodeJwtPayload reads base64url payloads", () => {
  const payload = { login: "octocat", githubId: 1 };
  assert.deepEqual(decodeJwtPayload(makeToken(payload)), payload);
});

test("decodeJwtPayload handles every base64url variant", () => {
  // A GitHub avatar URL encodes to "_" in base64url, which is what made
  // atob() throw on roughly half of all real tokens. The cases below force
  // both "-" and "_" so both substitutions are covered every run.
  const payloads = [
    { login: "user1", githubId: 1, avatar: "https://avatars.githubusercontent.com/u/1?v=4" },
    { login: "a>b", githubId: 2 },
    { login: "a~b", githubId: 3 },
    { login: "a?b", githubId: 4, profile: "https://github.com/a?b" },
  ];

  const seen = new Set();
  for (const payload of payloads) {
    const segment = makeToken(payload).split(".")[1];
    if (segment.includes("-")) seen.add("dash");
    if (segment.includes("_")) seen.add("underscore");
    assert.deepEqual(decodeJwtPayload(makeToken(payload)), payload);
  }

  assert.ok(seen.has("dash"), "expected a payload containing -");
  assert.ok(seen.has("underscore"), "expected a payload containing _");
});

test("decodeJwtPayload survives 500 randomised real-shaped tokens", () => {
  for (let i = 0; i < 500; i += 1) {
    const payload = {
      login: `user${i}`,
      githubId: 1000 + i,
      avatar: `https://avatars.githubusercontent.com/u/${1000 + i}?v=4`,
      profile: `https://github.com/user${i}`,
      iat: 1790941303,
      exp: 1791546103,
    };
    assert.deepEqual(decodeJwtPayload(makeToken(payload)), payload);
  }
});

test("decodeJwtPayload rejects malformed tokens", () => {
  assert.throws(() => decodeJwtPayload("no-dots"));
  assert.throws(() => decodeJwtPayload("only.two"));
  assert.throws(() => decodeJwtPayload("a.!!!not-base64!!!.c"));
});

test("decodeJwtPayload returns an exp the caller can check", () => {
  const future = Math.floor(Date.now() / 1000) + 3600;
  const past = Math.floor(Date.now() / 1000) - 3600;
  assert.ok(decodeJwtPayload(makeToken({ login: "a", exp: future })).exp > Date.now() / 1000);
  assert.ok(decodeJwtPayload(makeToken({ login: "a", exp: past })).exp <= Date.now() / 1000);
});