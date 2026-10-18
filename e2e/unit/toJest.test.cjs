"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { toJest } = require("../scripts/toJest.cjs");
const { toTestPilotReport } = require("../../server/scripts/publishTestReport.js");

test("Playwright result conversion preserves PASS, FAIL and SKIPPED results", () => {
  const input = {
    suites: [{ specs: [
      { title: "TC-0501 passed", tests: [{ status: "expected", results: [{ status: "passed", duration: 160 }] }] },
      { title: "TC-0502 failed", tests: [{ status: "unexpected", results: [{ status: "failed", duration: 45, error: { message: "Assertion mismatch" } }] }] },
      { title: "TC-0503 skipped", tests: [{ status: "skipped", results: [{ status: "skipped", duration: 0 }] }] }
    ] }]
  };
  const report = toTestPilotReport(toJest(input), "playwright-chromium");
  assert.equal(report.engine, "Static-CI");
  assert.equal(report.summary.total, 3);
  assert.equal(report.summary.passed, 1);
  assert.equal(report.summary.failed, 1);
  assert.equal(report.summary.skipped, 1);
  assert.deepEqual(report.testResults.map(a => a.id), ["TC-0501", "TC-0502"]);
});

test("empty or unfinished browser results cannot be published as successful", () => {
  assert.throws(() => toJest({ suites: [] }), /No actual Playwright/);
  const unfinished = toJest({ suites: [{ specs: [
    { title: "TC-0504 incomplete", tests: [{ status: "unexpected", results: [] }] }
  ] }] });
  assert.equal(unfinished.testResults[0].assertionResults[0].status, "failed");
});
