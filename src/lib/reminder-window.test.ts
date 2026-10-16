import { test } from "node:test";
import assert from "node:assert/strict";
import { reminderHourOptions, utcHourToLocalHour, formatHour } from "./reminder-window.ts";

test("UTC user can pick any hour", () => {
  assert.equal(reminderHourOptions(0).length, 24);
});

test("Pacific (UTC-7) is limited to local midnight through 4 PM", () => {
  const opts = reminderHourOptions(-420);
  assert.equal(opts[0].localHour, 0);
  assert.equal(opts.at(-1)?.localHour, 16);
  assert.equal(opts.find((o) => o.localHour === 9)?.utcHour, 16);
});

test("UTC+9 is limited to 9 AM through 11 PM", () => {
  const opts = reminderHourOptions(540);
  assert.equal(opts[0].localHour, 9);
  assert.equal(opts[0].utcHour, 0);
  assert.equal(opts.at(-1)?.localHour, 23);
});

test("every option stays on the user's own local date", () => {
  for (const offset of [-720, -420, -300, 0, 60, 330, 540, 840]) {
    for (const o of reminderHourOptions(offset)) {
      assert.ok(o.utcHour >= 0 && o.utcHour <= 23);
    }
  }
});

test("utcHourToLocalHour inverts the mapping and wraps", () => {
  assert.equal(utcHourToLocalHour(16, -420), 9);
  assert.equal(utcHourToLocalHour(0, -420), 17);
  assert.equal(utcHourToLocalHour(23, 540), 8);
});

test("formatHour", () => {
  assert.equal(formatHour(0), "12:00 AM");
  assert.equal(formatHour(12), "12:00 PM");
  assert.equal(formatHour(17), "5:00 PM");
});
