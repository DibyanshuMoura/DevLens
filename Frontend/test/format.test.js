import test from "node:test";
import assert from "node:assert/strict";

import { fmtNum, fmtDelta, fmtDate } from "../src/lib/format.js";

test("fmtNum returns an en dash for non-finite input", () => {
  assert.equal(fmtNum(NaN), "–");
  assert.equal(fmtNum(Infinity), "–");
  assert.equal(fmtNum(-Infinity), "–");
  assert.equal(fmtNum(undefined), "–");
  assert.equal(fmtNum(null), "–");
  assert.equal(fmtNum("12"), "–");
});

test("fmtNum abbreviates thousands and millions", () => {
  assert.equal(fmtNum(0), "0");
  assert.equal(fmtNum(999), "999");
  assert.equal(fmtNum(1000), "1k");
  assert.equal(fmtNum(1500), "1.5k");
  assert.equal(fmtNum(1_000_000), "1m");
  assert.equal(fmtNum(2_400_000), "2.4m");
});

test("fmtDelta signs positive values and guards bad input", () => {
  assert.equal(fmtDelta(5), "+5");
  assert.equal(fmtDelta(-5), "-5");
  assert.equal(fmtDelta(0), "±0");
  assert.equal(fmtDelta(NaN), "±0");
  assert.equal(fmtDelta(undefined), "±0");
  assert.equal(fmtDelta(1500), "+1.5k");
});

test("fmtDate renders a readable date and guards invalid input", () => {
  assert.equal(fmtDate(null), "–");
  assert.equal(fmtDate(undefined), "–");
  assert.equal(fmtDate("garbage"), "–");
  const rendered = fmtDate("2026-10-02T00:00:00Z");
  assert.match(rendered, /^[A-Z][a-z]{2} \d{1,2}, \d{4}$/);
});