import { test } from "node:test";
import assert from "node:assert/strict";
import { dayStartUtc } from "./ai-limits.ts";

test("returns UTC midnight of the given instant", () => {
  assert.equal(dayStartUtc(new Date("2025-03-10T15:45:12.345Z")).toISOString(), "2025-03-10T00:00:00.000Z");
});

test("exact boundary instants", () => {
  assert.equal(dayStartUtc(new Date("2025-03-10T00:00:00.000Z")).toISOString(), "2025-03-10T00:00:00.000Z");
  assert.equal(dayStartUtc(new Date("2025-03-10T23:59:59.999Z")).toISOString(), "2025-03-10T00:00:00.000Z");
  assert.equal(dayStartUtc(new Date("2025-03-11T00:00:00.000Z")).toISOString(), "2025-03-11T00:00:00.000Z");
});

test("uses the UTC day, not the offset's local day", () => {
  // 20:00 at -08:00 on Mar 10 is 04:00Z on Mar 11.
  assert.equal(dayStartUtc(new Date("2025-03-10T20:00:00-08:00")).toISOString(), "2025-03-11T00:00:00.000Z");
  // 02:00 at +09:00 on Mar 11 is 17:00Z on Mar 10.
  assert.equal(dayStartUtc(new Date("2025-03-11T02:00:00+09:00")).toISOString(), "2025-03-10T00:00:00.000Z");
});

test("year and leap day boundaries", () => {
  assert.equal(dayStartUtc(new Date("2025-12-31T23:59:59.999Z")).toISOString(), "2025-12-31T00:00:00.000Z");
  assert.equal(dayStartUtc(new Date("2024-02-29T12:00:00Z")).toISOString(), "2024-02-29T00:00:00.000Z");
});

test("does not mutate its input", () => {
  const input = new Date("2025-03-10T15:00:00Z");
  dayStartUtc(input);
  assert.equal(input.toISOString(), "2025-03-10T15:00:00.000Z");
});
