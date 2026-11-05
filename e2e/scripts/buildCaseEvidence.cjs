"use strict";

// Evidence adapter for the existing Playwright JSON reporter. Never infers PASS
// from a case title, design comparison, or a model response.
const fs = require("node:fs");
const path = require("node:path");

const FIXED_CHECKS = Object.freeze([
  {id:"ARCHIVE-US017-AI001", title:"AI-001 POSITIVE | valid booking creates exactly one Pending appointment", origin:"GEMINI_2026_10_26_REVIEWED_INTENT", storyId:"US-017", modelCaseId:"AI-001", manualCaseIds:["TP-023"]},
  {id:"ARCHIVE-US017-AI002", title:"AI-002 NEGATIVE | already reserved slot returns conflict and no duplicate", origin:"GEMINI_2026_10_26_REVIEWED_INTENT", storyId:"US-017", modelCaseId:"AI-002", manualCaseIds:["TP-026"]},
  {id:"ARCHIVE-US017-AI003", title:"AI-003 NEGATIVE | missing mandatory booking fields are rejected", origin:"GEMINI_2026_10_26_REVIEWED_INTENT", storyId:"US-017", modelCaseId:"AI-003", manualCaseIds:[]},
  {id:"ARCHIVE-US017-AI004", title:"AI-004 SECURITY | unauthenticated booking is denied", origin:"GEMINI_2026_10_26_REVIEWED_INTENT", storyId:"US-017", modelCaseId:"AI-004", manualCaseIds:[]},
  {id:"SOURCE-US018-CONCURRENT", title:"US-018 EDGE | concurrent patients cannot double-book the same slot", origin:"SOURCE_DERIVED_NOT_FROM_2026_10_26_GEMINI", storyId:"US-018", manualCaseIds:["TP-025"]},
  {id:"SOURCE-US001-REGISTER", title:"US-001 POSITIVE | valid registration returns a token and persisted user", origin:"SOURCE_DERIVED_FIXED_ASSERTION", storyId:"US-001", manualCaseIds:["TP-001"]},
  {id:"SOURCE-US001-PW7", title:"US-001 NEGATIVE | 7-character password is rejected with no user stored", origin:"SOURCE_DERIVED_FIXED_ASSERTION", storyId:"US-001", manualCaseIds:["TP-003"]},
  {id:"SOURCE-US001-PW8", title:"US-001 BOUNDARY | exactly 8-character password is accepted", origin:"SOURCE_DERIVED_FIXED_ASSERTION", storyId:"US-001", manualCaseIds:["TP-004"]},
  {id:"SOURCE-US005-FILTER", title:"US-005 POSITIVE/NEGATIVE | only approved doctors are returned", origin:"SOURCE_DERIVED_FIXED_ASSERTION", storyId:"US-005", manualCaseIds:["TP-011"]},
  {id:"SOURCE-US005-EMPTY", title:"US-005 EDGE | empty approved directory returns a valid empty array", origin:"SOURCE_DERIVED_FIXED_ASSERTION", storyId:"US-005", manualCaseIds:["TP-012"]}
]);

// Links to the authentic 10-guided-run export, SHA-256 below. The fixed tests
// existed separately; matching an AI scenario to a test is NOT approval of the
// literal model steps, nor a second independent execution.
const STUDY_EXPORT_SHA256 = "b627b702e25167d32100eb20b91928b2f5d5236006b0b22f393fc08c6008623f";
const STUDY_LINKS = Object.freeze([
  {candidateId:"BITS10-US001-R5-AI001", fixedCheckId:"SOURCE-US001-REGISTER", note:"Registration intent only. The model's invalid example phone and mobile/phone naming require fixture correction."},
  {candidateId:"BITS10-US005-R7-AI002", fixedCheckId:"SOURCE-US005-EMPTY", note:"Empty-catalog intent only. Fixed assertion verifies [] whereas the model only stated HTTP 200 and an array."},
  {candidateId:"BITS10-US017-R13-AI004", fixedCheckId:"SOURCE-US018-CONCURRENT", note:"Concurrent collision intent, first described in the source-derived US-018 fixed test. One measured assertion reused; no duplicate test count."}
]);

function allSpecs(suites, output = []) {
  for (const suite of suites || []) {
    if (Array.isArray(suite.specs)) output.push(...suite.specs);
    allSpecs(suite.suites, output);
  }
  return output;
}

function safeAttachmentPath(value) {
  if (typeof value !== "string" || value.includes("..")) return null;
  const s = value.replace(/\\/g, "/");
  const at = s.lastIndexOf("/e2e/");
  const rel = at >= 0 ? s.slice(at + 1) :
    s.startsWith("e2e/") ? s :
    s.startsWith("test-results/") ? "e2e/" + s : null;
  return rel && /^e2e\/(test-results|artifacts)\/[a-zA-Z0-9_./-]+$/.test(rel) ? rel : null;
}

function classify(test) {
  if (test.status === "skipped") return "SKIPPED";
  const results = Array.isArray(test.results) ? test.results : [];
  const last = results[results.length - 1];
  if (!last) return "NOT_RECORDED";
  if (last.status === "passed" && test.status === "flaky") return "PASS_WITH_RETRY";
  if (last.status === "passed" && test.status === "expected") return "PASS";
  if (last.status === "skipped") return "SKIPPED";
  if (["failed","timedOut","interrupted"].includes(last.status) || test.status === "unexpected") return "FAIL";
  return "NOT_RECORDED";
}

function combineStatuses(statuses) {
  if (!statuses.length) return "NOT_RECORDED";
  if (statuses.some(s => s === "FAIL")) return "FAIL";
  if (statuses.every(s => s === "SKIPPED")) return "SKIPPED";
  if (statuses.every(s => s === "NOT_RECORDED")) return "NOT_RECORDED";
  if (statuses.some(s => s === "NOT_RECORDED" || s === "SKIPPED")) return "PARTIAL";
  if (statuses.some(s => s === "PASS_WITH_RETRY")) return "PASS_WITH_RETRY";
  return "PASS";
}

function buildCaseEvidence(json, meta = {}) {
  if (!json || !Array.isArray(json.suites)) throw Error("A genuine Playwright JSON report with suites is required.");
  if (meta.isolated !== true) throw Error("Refusing to certify a non-isolated or unverified test environment.");
  const specs = allSpecs(json.suites);
  const cases = FIXED_CHECKS.map(def => {
    const matches = specs.filter(s => s.title === def.title);
    if (matches.length > 1) throw Error("Duplicate Playwright case title: " + def.title);
    const tests = matches[0] && Array.isArray(matches[0].tests) ? matches[0].tests : [];
    const attempts = tests.flatMap(t => t.results || []);
    const attachments = [...new Set(attempts.flatMap(a => a.attachments || [])
      .map(a => safeAttachmentPath(a.path)).filter(Boolean))];
    return {
      caseId: def.id, storyId: def.storyId, modelCaseId: def.modelCaseId || null,
      sourceCategory: def.origin, manualCaseIds: def.manualCaseIds, playwrightTitle: def.title,
      status: combineStatuses(tests.map(classify)), attemptCount: attempts.length,
      durationMs: attempts.reduce((n, result) => n + (Number.isFinite(result.duration) ? result.duration : 0), 0),
      attachments, reportArtifactName: "playwright-chromium-report"
    };
  });
  const byId = new Map(cases.map(c => [c.caseId,c]));
  const linked = STUDY_LINKS.map(link => ({
    candidateId: link.candidateId, matchedFixedCheckId:link.fixedCheckId,
    measuredCheckStatus:byId.get(link.fixedCheckId).status,
    sourceExportSha256:STUDY_EXPORT_SHA256,
    evidenceClassification:"REVIEWED_INTENT_ALIGNMENT_NOT_LITERAL_AI_EXECUTION",
    separatelyCountedExecution:false, caveat:link.note
  }));
  const counts = cases.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1; return acc;
  }, {});
  const repo = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(meta.repository || "") ? meta.repository : null;
  const runId = /^\d+$/.test(String(meta.runId || "")) ? String(meta.runId) : null;
  return {
    schema:"testpilot-fixed-check-evidence-v1", generatedAtUtc:new Date().toISOString(),
    evidenceKind:"MEASURED_PLAYWRIGHT_JSON_NOT_MODEL_EXECUTION",
    workflow: {runId, runAttempt:String(meta.runAttempt || ""), commitSha:meta.sha || null,
      url:repo && runId ? "https://github.com/" + repo + "/actions/runs/" + runId : null},
    environment:"ISOLATED_LOCALHOST_API_AND_SYNTHETIC_TEST_MONGODB",
    originalGeminiStudy:{guidedRuns:10, guidedDesigns:40, rawCandidateExecutionStatus:"NOT_RUN",
      sourceExportSha256:STUDY_EXPORT_SHA256},
    fixedChecks:cases, fixedCheckStatusCounts:counts, guidedCandidateIntentLinks:linked,
    limitations:[
      "Only fixed, source-reviewed assertions are executed, never arbitrary Gemini code or model-provided test steps.",
      "Three guided Nov 5 candidate scenario intents align with pre-existing fixed tests; other 37 guided designs are not linked here.",
      "Older 2026-10-26 Gemini US-017 case IDs and Nov 5 study case IDs are different case sets; do not merge their case counts.",
      "Do not count mapped study links as additional executions, or represent operator ratings as independent reviewer sign-offs.",
      "Artifact paths and run URL only resolve if uploaded by the GitHub workflow; screenshots/traces exist only when generated."
    ]
  };
}

if (require.main === module) {
  try {
    const input = process.argv[2] || "e2e/artifacts/results.json";
    const output = process.argv[3] || "e2e/artifacts/task-4-6-case-evidence.json";
    const mongo = "mongodb://127.0.0.1:27017/testpilot_generated_test";
    const isolated = process.env.NODE_ENV === "test" && process.env.TESTPILOT_ISOLATED_API === "1" &&
      process.env.MONGO_URI === mongo && process.env.MONGO_URI_TEST === mongo;
    const evidence = buildCaseEvidence(JSON.parse(fs.readFileSync(input,"utf8")),{
      isolated, runId:process.env.GITHUB_RUN_ID, runAttempt:process.env.GITHUB_RUN_ATTEMPT,
      sha:process.env.GITHUB_SHA, repository:process.env.GITHUB_REPOSITORY
    });
    fs.mkdirSync(path.dirname(output), {recursive:true});
    fs.writeFileSync(output, JSON.stringify(evidence,null,2) + "\n", "utf8");
    console.log("Wrote measured case evidence: " + output +
      " (" + evidence.fixedChecks.length + " named checks)");
  } catch (error) {
    console.error("Measured case evidence not generated: " + error.message);
    process.exitCode = 1;
  }
}
module.exports = {buildCaseEvidence, safeAttachmentPath, classify, FIXED_CHECKS, STUDY_LINKS};
