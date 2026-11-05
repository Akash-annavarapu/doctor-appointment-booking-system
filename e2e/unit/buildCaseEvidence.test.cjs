"use strict";
const {test} = require("node:test");
const assert = require("node:assert/strict");
const {buildCaseEvidence, FIXED_CHECKS, STUDY_LINKS, safeAttachmentPath} =
  require("../scripts/buildCaseEvidence.cjs");

function makeReport(title, status, resultStatus, attachment) {
  return {suites:[{title:"suite", specs:[{title, tests:[{
    status, results:resultStatus ? [{status:resultStatus,duration:123,
      attachments:attachment ? [{name:"screenshot",path:attachment}] : []}] : []
  }]}]}]};
}
const env={isolated:true, repository:"Akash-annavarapu/doctor-appointment-booking-system",
  runId:"12345", runAttempt:"1", sha:"abc123"};

test("existing measured PASS maps only its exact test title, not all Gemini cases",() => {
  const report=makeReport(FIXED_CHECKS[0].title,"expected","passed");
  const result=buildCaseEvidence(report,env);
  assert.equal(result.fixedChecks[0].status,"PASS");
  assert.equal(result.fixedChecks[0].durationMs,123);
  assert.equal(result.fixedChecks[1].status,"NOT_RECORDED");
  assert.equal(result.originalGeminiStudy.rawCandidateExecutionStatus,"NOT_RUN");
  assert.equal(result.workflow.url,
    "https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/runs/12345");
  assert.equal(result.fixedCheckStatusCounts.PASS,1);
  assert.equal(result.fixedCheckStatusCounts.NOT_RECORDED,FIXED_CHECKS.length-1);
});

test("FAIL and screenshot are reported only when genuinely present",() => {
  const report=makeReport(FIXED_CHECKS[1].title,"unexpected","failed",
    "/home/runner/work/repo/repo/e2e/test-results/AI-002/test-failed-1.png");
  const result=buildCaseEvidence(report,env);
  assert.equal(result.fixedChecks[1].status,"FAIL");
  assert.deepEqual(result.fixedChecks[1].attachments,["e2e/test-results/AI-002/test-failed-1.png"]);
  assert.deepEqual(result.fixedChecks[0].attachments,[]);
});

test("skipped, flaky and incomplete results are not presented as clean passes",() => {
  assert.equal(buildCaseEvidence(makeReport(FIXED_CHECKS[2].title,"skipped","skipped"),env)
    .fixedChecks[2].status,"SKIPPED");
  assert.equal(buildCaseEvidence(makeReport(FIXED_CHECKS[2].title,"flaky","passed"),env)
    .fixedChecks[2].status,"PASS_WITH_RETRY");
  assert.equal(buildCaseEvidence(makeReport(FIXED_CHECKS[2].title,"expected",null),env)
    .fixedChecks[2].status,"NOT_RECORDED");
});

test("unverified or non-isolated source cannot produce an execution certificate",() => {
  assert.throws(()=>buildCaseEvidence(makeReport(FIXED_CHECKS[0].title,"expected","passed"),
    {isolated:false}),/non-isolated/);
  assert.throws(()=>buildCaseEvidence({},env),/genuine Playwright/);
});

test("candidate mappings reuse actual checks and do not inflate execution count",() => {
  const result=buildCaseEvidence({suites:[]},env);
  assert.equal(result.guidedCandidateIntentLinks.length,STUDY_LINKS.length);
  assert.ok(result.guidedCandidateIntentLinks.every(x => x.separatelyCountedExecution===false));
  assert.equal(result.guidedCandidateIntentLinks[0].measuredCheckStatus,"NOT_RECORDED");
});

test("do not leak an arbitrary external path as artifact",() => {
  assert.equal(safeAttachmentPath("../../.env"),null);
  assert.equal(safeAttachmentPath("/tmp/password.json"),null);
  assert.equal(safeAttachmentPath("test-results/fail/trace.zip"),"e2e/test-results/fail/trace.zip");
});
