"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  issueReceipt, verifyReceipt, validateApprovedCases, executeGeneratedCases
} = require("../generatedCaseRunner");
const { CHECKS, BACKEND } = require("../verifiedChecks");

const storyId = "US-005";
const targetUrl = "https://doctor-appointment-frontend-9dbs.onrender.com/";
const pinned = CHECKS.find(check => check.id === "approved-doctor-list");

function cases() {
  return Array.from({ length: 4 }, (_, index) => ({
    id: "AI-" + String(index + 1).padStart(3, "0"),
    title: index ? "Another drafted non-mutating scenario" : "Review public approved doctors",
    type: index ? "negative" : "positive", priority: "P1",
    preconditions: "Existing public approved-doctor catalog",
    steps: ["Review user story", "Check actual response"],
    testData: "Public synthetic doctor record",
    expectedResult: index ? "Requires isolated CI" : pinned.expected,
    probeId: index ? "NONE" : pinned.id,
    reviewed: false, executionStatus: "NOT_RUN"
  }));
}
test("signed AI generation receipt binds the exact story, URL, and complete cases", () => {
  const items = cases();
  const receipt = issueReceipt(storyId, targetUrl, items);
  assert.doesNotThrow(() => verifyReceipt(receipt, storyId, targetUrl, items));
  assert.throws(() => verifyReceipt(receipt, "US-006", targetUrl, items), /changed|expired/);
  assert.throws(() => verifyReceipt(receipt, storyId, "https://example.org/", items), /changed|expired/);
  assert.throws(() => verifyReceipt(receipt, storyId, targetUrl, [...items].reverse()), /changed|expired/);
  const changed = cases();
  changed[0].expectedResult = "always PASS";
  assert.throws(() => verifyReceipt(receipt, storyId, targetUrl, changed));
  assert.throws(() => verifyReceipt(receipt + "tampering", storyId, targetUrl, items));
});

test("receipt expires and cannot be used before issuance", () => {
  const items = cases();
  const old = Date.now() - (31 * 60 * 1000);
  const receipt = issueReceipt(storyId, targetUrl, items, old);
  assert.throws(() => verifyReceipt(receipt, storyId, targetUrl, items), /expired/);
  const future = issueReceipt(storyId, targetUrl, items, Date.now() + 60_000);
  assert.throws(() => verifyReceipt(future, storyId, targetUrl, items), /expired/);
});

test("approved cases must only use story-linked source-verified probes", () => {
  assert.equal(validateApprovedCases(storyId, cases(), ["AI-001"]).selected.length, 1);
  const wrong = cases();
  wrong[0].probeId = "session-auth-required";
  assert.throws(() => validateApprovedCases(storyId, wrong, ["AI-001"]), /unverified/);
  assert.throws(() => validateApprovedCases(storyId, cases(), ["AI-999"]), /Unknown/);
  assert.throws(() => validateApprovedCases(storyId, cases(), ["AI-001", "AI-001"]));
  const fake = cases();
  fake[0].executionStatus = "PASS";
  assert.throws(() => validateApprovedCases(storyId, fake, ["AI-001"]));
});

test("explicitly approved bound AI case runs real GET and reports measured PASS only for that assertion", async () => {
  const items = cases();
  const receipt = issueReceipt(storyId, targetUrl, items);
  const calls = [];
  const result = await executeGeneratedCases(storyId, targetUrl, items,
    ["AI-001", "AI-002"], receipt, {
      fetchImpl: async (url, options) => {
        calls.push([url, options.method]);
        return { status: 200, ok: true, json: async () =>
          ({ success: true, doctors: [{ specialization: "Cardiology" }] }) };
      }
    });
  assert.deepEqual(calls, [[BACKEND + "/api/v1/doctor/all", "GET"]]);
  assert.equal(result.summary.total, 2);
  assert.equal(result.summary.passed, 1);
  assert.equal(result.summary.skipped, 1);
  assert.equal(result.results[0].id, "AI-001");
  assert.equal(result.results[0].scope, "AI_CASE_BOUND_TO_VERIFIED_READ_ONLY_PROBE");
  assert.match(result.interpretation, /not the complete generated narrative/);
  assert.equal(result.results[1].status, "SKIPPED");
  assert.equal(result.generatedTestsExecuted, true);
});

test("non-executable generated cases are SKIPPED without touching live healthcare", async () => {
  const items = cases();
  const receipt = issueReceipt(storyId, targetUrl, items);
  const result = await executeGeneratedCases(storyId, targetUrl, items, ["AI-003"],
    receipt, { fetchImpl: async () => { throw Error("MUST NOT TOUCH NETWORK"); } });
  assert.equal(result.summary.skipped, 1);
  assert.equal(result.summary.passed, 0);
  assert.equal(result.generatedTestsExecuted, false);
});

test("failed live response is honestly reported as FAIL, not model-predicted success", async () => {
  const items = cases();
  const receipt = issueReceipt(storyId, targetUrl, items);
  const result = await executeGeneratedCases(storyId, targetUrl, items,
    ["AI-001"], receipt, { fetchImpl: async () =>
      ({ status: 503, ok: false, json: async () => ({}) }) });
  assert.equal(result.summary.failed, 1);
  assert.equal(result.summary.passed, 0);
  assert.equal(result.results[0].status, "FAIL");
});
