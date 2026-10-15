"use strict";

const crypto = require("node:crypto");
const { CHECKS, executeStoryChecks } = require("./verifiedChecks");

// Sign accepted model output at creation time. The signing key is only held in server memory.
// A deploy invalidates outstanding generation receipts rather than trusting client edits.
const signingKey = crypto.randomBytes(32);
const TTL_MS = 30 * 60 * 1000;

function digest(storyId, targetUrl, cases) {
  return crypto.createHash("sha256")
    .update(JSON.stringify({ storyId, targetUrl, cases })).digest("hex");
}

function issueReceipt(storyId, targetUrl, cases, now = Date.now()) {
  const claims = { storyId, targetUrl, digest: digest(storyId, targetUrl, cases),
    issuedAt: now, nonce: crypto.randomUUID() };
  const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = crypto.createHmac("sha256", signingKey).update(body).digest("base64url");
  return body + "." + signature;
}

function verifyReceipt(receipt, storyId, targetUrl, cases, now = Date.now()) {
  if (typeof receipt !== "string" || receipt.length > 2000 ||
      !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(receipt)) {
    throw Error("Missing or invalid signed generation receipt.");
  }
  const [body, signature] = receipt.split(".");
  const expected = crypto.createHmac("sha256", signingKey).update(body).digest();
  const actual = Buffer.from(signature, "base64url");
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    throw Error("The generation receipt could not be verified.");
  }
  let claims;
  try { claims = JSON.parse(Buffer.from(body, "base64url").toString("utf8")); }
  catch { throw Error("Generation receipt payload is invalid."); }
  if (!claims || claims.storyId !== storyId || claims.targetUrl !== targetUrl ||
      claims.digest !== digest(storyId, targetUrl, cases) ||
      !Number.isFinite(claims.issuedAt) || claims.issuedAt > now ||
      now - claims.issuedAt > TTL_MS) {
    throw Error("Generated test cases were changed or the receipt expired.");
  }
}

function validateApprovedCases(storyId, cases, selectedIds) {
  if (typeof storyId !== "string" ||
      !Array.isArray(cases) || cases.length < 4 || cases.length > 8 ||
      !Array.isArray(selectedIds) || !selectedIds.length || selectedIds.length > 8 ||
      new Set(selectedIds).size !== selectedIds.length) {
    throw Error("Submit an approved subset of the generated test cases.");
  }
  const ids = new Set();
  const allowedProbes = new Map(CHECKS.filter(check => check.stories.includes(storyId))
    .map(check => [check.id, check]));
  for (const item of cases) {
    if (!item || !/^AI-\d{3}$/.test(item.id) || ids.has(item.id) ||
        typeof item.title !== "string" || item.title.length > 650 ||
        !["NOT_RUN", "SKIPPED"].includes(item.executionStatus) ||
        item.reviewed !== false ||
        typeof item.probeId !== "string" ||
        (item.probeId !== "NONE" && (!allowedProbes.has(item.probeId) ||
          item.expectedResult !== allowedProbes.get(item.probeId).expected))) {
      throw Error("Invalid or unverified generated test case.");
    }
    ids.add(item.id);
  }
  if (!selectedIds.every(id => ids.has(id))) throw Error("Unknown generated test case ID.");
  return { selected: cases.filter(item => selectedIds.includes(item.id)), allowedProbes };
}

async function executeGeneratedCases(storyId, targetUrl, cases, selectedIds, receipt,
    { fetchImpl = fetch } = {}) {
  verifyReceipt(receipt, storyId, targetUrl, cases);
  const { selected, allowedProbes } = validateApprovedCases(storyId, cases, selectedIds);
  const start = Date.now();
  const runnable = selected.filter(item => item.probeId !== "NONE");
  // Exactly the same audited read-only GET implementation as the Lab's existing live checks.
  const run = runnable.length ? await executeStoryChecks(storyId, { fetchImpl }) : null;
  const actualByProbe = new Map((run?.results || []).map(result => [result.id, result]));
  const results = selected.map(item => {
    const matched = allowedProbes.get(item.probeId);
    const result = matched ? actualByProbe.get(item.probeId) : null;
    if (!matched || !result) return {
      id: item.id, title: item.title, status: "SKIPPED", executionTime: 0,
      actual: "This LLM case requires isolated staging fixtures or manual review. No production mutation was attempted.",
      expected: item.expectedResult, probeId: "NONE",
      scope: "UNSUPPORTED_GENERATED_CASE"
    };
    return { id: item.id, title: item.title, status: result.status,
      actual: result.actual, expected: matched.expected, probeId: matched.id,
      executionTime: result.executionTime, scope: "AI_CASE_BOUND_TO_VERIFIED_READ_ONLY_PROBE" };
  });
  return {
    runId: "gen-" + crypto.randomUUID(), storyId, timestamp: new Date().toISOString(),
    targetUrl, generatedTestsExecuted: results.some(r => r.scope === "AI_CASE_BOUND_TO_VERIFIED_READ_ONLY_PROBE"),
    executionScope: "APPROVED_GENERATED_CASES_BOUND_TO_SAFE_LIVE_PROBES",
    interpretation: "PASS/FAIL applies only to the source-verified read-only assertion, not the complete generated narrative scenario.",
    summary: {
      total: results.length, passed: results.filter(r => r.status === "PASS").length,
      failed: results.filter(r => r.status === "FAIL").length,
      skipped: results.filter(r => r.status === "SKIPPED").length,
      durationMs: Date.now() - start
    }, results
  };
}

module.exports = { issueReceipt, verifyReceipt, validateApprovedCases, executeGeneratedCases };
