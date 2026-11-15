import { test } from "node:test";
import assert from "node:assert/strict";

import calculateResult from "../utils/calculateResult.js";

test("grades follow the published boundaries", () => {
  assert.equal(calculateResult(95, 100, 40).grade, "A+");
  assert.equal(calculateResult(90, 100, 40).grade, "A+");
  assert.equal(calculateResult(89, 100, 40).grade, "A");
  assert.equal(calculateResult(80, 100, 40).grade, "A");
  assert.equal(calculateResult(75, 100, 40).grade, "B");
  assert.equal(calculateResult(65, 100, 40).grade, "C");
  assert.equal(calculateResult(55, 100, 40).grade, "D");
  assert.equal(calculateResult(45, 100, 40).grade, "E");
  assert.equal(calculateResult(39, 100, 40).grade, "F");
});

test("status: marks at exactly the pass mark count as Pass", () => {
  assert.equal(calculateResult(40, 100, 40).status, "Pass");
  assert.equal(calculateResult(39.9, 100, 40).status, "Fail");
});

test("percentage is rounded to two decimals", () => {
  // 2/3 = 66.666...%
  assert.equal(calculateResult(2, 3, 1).percentage, 66.67);
  assert.equal(calculateResult(1, 3, 1).percentage, 33.33);
});

test("zero marks gives 0% and F", () => {
  const result = calculateResult(0, 100, 40);
  assert.equal(result.percentage, 0);
  assert.equal(result.grade, "F");
  assert.equal(result.status, "Fail");
});

test("full marks gives 100% and A+", () => {
  const result = calculateResult(100, 100, 40);
  assert.equal(result.percentage, 100);
  assert.equal(result.grade, "A+");
  assert.equal(result.status, "Pass");
});
