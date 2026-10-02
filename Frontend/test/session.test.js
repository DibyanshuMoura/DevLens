import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

const { readCachedUser, decodeJwtPayload } = await import("../src/lib/auth.js");

const KEY = "devlens_token";
const b64url = (s) =>
  Buffer.from(s).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function makeToken(payload, expOffsetSec = 3600) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(
    JSON.stringify({
      login: "octocat",
      githubId: 1,
      avatar: "https://avatars.githubusercontent.com/u/1?v=4",
      profile: "https://github.com/octocat",
      ...payload,
      exp: Math.floor(Date.now() / 1000) + expOffsetSec,
    }),
  );
  return `${header}.${body}.${crypto.randomBytes(8).toString("hex")}`;
}

test.beforeEach(() => store.clear());

test("readCachedUser returns the user from a stored token", () => {
  store.set(KEY, makeToken({}));
  const user = readCachedUser();
  assert.equal(user.login, "octocat");
  assert.equal(user.githubId, undefined);
  assert.equal(user.profile, "https://github.com/octocat");
});

test("readCachedUser returns null when no token is stored", () => {
  assert.equal(readCachedUser(), null);
});

test("readCachedUser discards an expired token", () => {
  store.set(KEY, makeToken({}, -10));
  assert.equal(readCachedUser(), null);
  assert.equal(store.has(KEY), false, "expired token should be cleared");
});

test("readCachedUser survives a malformed token", () => {
  store.set(KEY, "not-a-jwt");
  assert.equal(readCachedUser(), null);
});

test("readCachedUser avoids the network entirely", () => {
  // The whole point of this helper: App renders the user on the first paint
  // without awaiting /auth/me, so returning a user here must not touch fetch.
  let fetched = false;
  globalThis.fetch = () => {
    fetched = true;
    throw new Error("should not be called");
  };
  store.set(KEY, makeToken({}));
  assert.equal(readCachedUser().login, "octocat");
  assert.equal(fetched, false);
  delete globalThis.fetch;
});

test("decodeJwtPayload still rejects malformed input", () => {
  assert.throws(() => decodeJwtPayload("nope"));
});