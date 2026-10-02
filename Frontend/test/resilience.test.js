import test from "node:test";
import assert from "node:assert/strict";

import { fmtNum } from "../src/lib/format.js";

const finite = (v) => typeof v === "number" && Number.isFinite(v);

test("score guards treat NaN and Infinity as missing", () => {
  assert.equal(finite(NaN), false);
  assert.equal(finite(Infinity), false);
  assert.equal(finite(-Infinity), false);
  assert.equal(finite(0), true);
  assert.equal(finite(75), true);
});

test("ScoreMeter bar width is always valid CSS", () => {
  const pct = (value, max = 100) =>
    finite(value) ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  for (const bad of [NaN, Infinity, -Infinity, undefined, null, "80"]) {
    const v = pct(bad);
    assert.ok(Number.isFinite(v), `width for ${bad} must be finite`);
    assert.ok(v >= 0 && v <= 100);
  }
  assert.equal(pct(75), 75);
  assert.equal(pct(-10), 0, "clamps below zero");
  assert.equal(pct(500), 100, "clamps above max");
});

test("trend points drop non-finite values instead of breaking the path", () => {
  const snaps = [
    { score: 50 },
    { score: NaN },
    { score: 70 },
    { score: Infinity },
    { score: 80 },
  ];
  const points = snaps
    .map((snap, i) => ({ i, v: snap.score }))
    .filter(({ v }) => finite(v));
  assert.equal(points.length, 3);
  assert.ok(points.every((p) => Number.isFinite(p.v)));
});

test("card stat labels never render NaN", () => {
  const fmt = (v) =>
    finite(v) && v >= 1000 ? `${(v / 1000).toFixed(1)}k` : fmtNum(v);
  assert.equal(fmt(2500), "2.5k");
  assert.equal(fmt(999), "999");
  assert.notEqual(fmt(NaN), "NaN", "must never render the string NaN");
  assert.equal(fmt(NaN), fmtNum(NaN), "falls back to the dash placeholder");
  assert.equal(fmt(Infinity), "–");
});

test("duplicate keys are avoided for LLM-generated string arrays", () => {
  const skills = ["React", "React", "Node"];
  const keys = skills.map((s, i) => `${s}-${i}`);
  assert.equal(new Set(keys).size, skills.length, "keys must be unique");
});