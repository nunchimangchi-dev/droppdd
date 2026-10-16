import { test } from "node:test";
import assert from "node:assert/strict";
import { computeGoalPercent } from "./progress-percent.ts";

test("normal loss progress scales by 105 against the distance", () => {
  // halfway: 0.5 * 105 = 52.5
  assert.equal(computeGoalPercent(200, 190, 180), 52.5);
});

test("gain goals use the same formula", () => {
  assert.equal(computeGoalPercent(150, 160, 170), 52.5);
});

test("reaching the goal exactly clamps to 100", () => {
  assert.equal(computeGoalPercent(200, 180, 180), 100);
});

test("passing the goal clamps to 100", () => {
  assert.equal(computeGoalPercent(200, 170, 180), 100);
});

test("start equals target returns 100 instead of NaN", () => {
  assert.equal(computeGoalPercent(180, 180, 180), 100);
  assert.equal(computeGoalPercent(180, 200, 180), 100);
});

test("wrong-direction movement clamps to the 5 floor", () => {
  assert.equal(computeGoalPercent(200, 210, 180), 5);
  assert.equal(computeGoalPercent(150, 140, 170), 5);
});

test("no progress yet shows the 5 floor", () => {
  // SUSPECT: current === start is 0% real progress but is reported as 5,
  // so the floor hides the difference between "not started" and "5% there".
  assert.equal(computeGoalPercent(200, 200, 180), 5);
});

test("the 105 multiplier reaches 100 before the goal is actually met", () => {
  // SUSPECT: anything past about 95.2% of the distance already reports 100
  // (180.5 is 97.5% of the way), so the UI shows a full bar before the
  // target is actually reached.
  assert.equal(computeGoalPercent(200, 181, 180), 99.75);
  assert.equal(computeGoalPercent(200, 180.5, 180), 100);
});
