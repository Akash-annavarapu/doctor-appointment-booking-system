"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { handle, FRONTEND, BACKEND } = require("../server");
const { issueReceipt } = require("../generatedCaseRunner");
const { CHECKS } = require("../verifiedChecks");
const { validateReview, issueReviewReceipt, verifyReviewReceipt, approvedIds } = require("../reviewSession");

const storyId = "US-005";
const targetUrl = FRONTEND + "/";
const check = CHECKS.find(c => c.id === "approved-doctor-list");
const originals = Array.from({ length: 4 }, (_, i) => ({
  id: "AI-" + String(i + 1).padStart(3, "0"),
  title: "Genuine test scenario " + i,
  type: i ? "negative" : "positive", priority: "P1",
  preconditions: "Synthetic fixture", steps: ["Inspect source-grounded output"],
  testData: "Not a real person", expectedResult: i ? "Pending fixture" : check.expected,
  probeId: i ? "NONE" : check.id, executionStatus: "NOT_RUN", reviewed: false
}));
const decisions = () => originals.map((c, i) => ({
  id: c.id, decision: i === 0 ? "APPROVED" : i === 1 ? "REJECTED" : "DRAFT",
  notes: i === 0 ? "Compared to source code; safe fixed assertion only" : "",
  edits: i === 0 ? { title: "Reviewed approved catalog assertion", steps: [
    "Inspect approved doctor listing via GET", "Assert 200 and a doctors array"
  ] } : {}
}));

test("review creates a separate validated revision without altering genuine LLM output", () => {
  const original = JSON.stringify(originals);
  const result = validateReview(originals, decisions());
  assert.equal(result.summary.approved, 1);
  assert.equal(result.summary.rejected, 1);
  assert.equal(result.summary.draft, 2);
  assert.equal(result.cases[0].title, "Reviewed approved catalog assertion");
  assert.equal(result.cases[0].probeId, check.id);
  assert.equal(result.cases[0].reviewDecision, "APPROVED");
  assert.equal(JSON.stringify(originals), original);
  assert.deepEqual(approvedIds(originals, decisions(), ["AI-001"]), ["AI-001"]);
  assert.throws(() => approvedIds(originals, decisions(), ["AI-002"]), /approved/);
  const forged = decisions();
  forged[0].edits = { probeId: "fake", expectedResult: "Always PASS" };
  assert.throws(() => validateReview(originals, forged), /narrative/);
  const duplicate = decisions(); duplicate[1].id = "AI-001";
  assert.throws(() => validateReview(originals, duplicate), /duplicate/);
});

test("review signature binds generation, exact decisions, story and expiry", () => {
  const base = issueReceipt(storyId, targetUrl, originals);
  const normalized = validateReview(originals, decisions()).decisions;
  const receipt = issueReviewReceipt(storyId, targetUrl, base, normalized);
  assert.doesNotThrow(() => verifyReviewReceipt(receipt, storyId, targetUrl, base, normalized));
  assert.throws(() => verifyReviewReceipt(receipt, "US-017", targetUrl, base, normalized));
  assert.throws(() => verifyReviewReceipt(receipt, storyId, targetUrl, "another-generation", normalized));
  const changed = structuredClone(normalized);
  changed[0].decision = "REJECTED";
  assert.throws(() => verifyReviewReceipt(receipt, storyId, targetUrl, base, changed));
  const old = issueReviewReceipt(storyId, targetUrl, base, normalized, Date.now() - 3600000);
  assert.throws(() => verifyReviewReceipt(old, storyId, targetUrl, base, normalized), /expired/);
});

test("HTTP user journey edits, reviews and executes ONLY original signed source probe", async () => {
  const previousCode = process.env.LAB_ACCESS_CODE;
  const fetchBefore = global.fetch;
  process.env.LAB_ACCESS_CODE = "a-local-synthetic-lab-code-for-testing";
  const outbound = [];
  global.fetch = async (url, options={}) => {
    outbound.push({url:String(url), method:options.method});
    if (String(url) === BACKEND + "/api/v1/doctor/all") {
      return new Response(JSON.stringify({success:true, doctors:[]}), {
        status:200, headers:{"content-type":"application/json"}
      });
    }
    throw Error("Unexpected external network request");
  };
  const server = http.createServer((req,res)=>handle(req,res));
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const local = "http://127.0.0.1:" + server.address().port;
  const send = async (route, payload) => {
    const res = await fetchBefore(local + route, { method: "POST",
      headers: {"content-type":"application/json"}, body:JSON.stringify(payload)});
    return {status:res.status, body:await res.json()};
  };
  try {
    const receipt = issueReceipt(storyId, targetUrl, originals);
    const base = {storyId,targetUrl,cases:originals,receipt,
      accessCode:process.env.LAB_ACCESS_CODE,decisions:decisions()};
    const review = await send("/api/review", base);
    assert.equal(review.status, 200);
    assert.equal(review.body.review.summary.approved, 1);
    assert.equal(review.body.review.cases[0].title,"Reviewed approved catalog assertion");
    const valid = {...base,reviewReceipt:review.body.reviewReceipt,selectedIds:["AI-001"]};
    const executed = await send("/api/execute-reviewed",valid);
    assert.equal(executed.status, 200);
    assert.equal(executed.body.run.summary.passed,1);
    assert.equal(executed.body.run.results[0].reviewedTitle,"Reviewed approved catalog assertion");
    assert.equal(executed.body.run.results[0].scope,"AI_CASE_BOUND_TO_VERIFIED_READ_ONLY_PROBE");
    assert.deepEqual(outbound,[{url:BACKEND + "/api/v1/doctor/all",method:"GET"}]);
    const no = await send("/api/execute-reviewed",{...valid,selectedIds:["AI-002"]});
    assert.equal(no.status,400);
    const forged = structuredClone(decisions()); forged[0].edits.title="Make it PASS";
    const changed = await send("/api/execute-reviewed",{...valid,decisions:forged});
    assert.equal(changed.status,400);
    const plan = await send("/api/browser-plan-reviewed",valid);
    assert.equal(plan.status,200);
    assert.equal(plan.body.executed,false);
  } finally {
    global.fetch=fetchBefore;
    if(previousCode===undefined)delete process.env.LAB_ACCESS_CODE;
    else process.env.LAB_ACCESS_CODE=previousCode;
    await new Promise(resolve=>server.close(resolve));
  }
});
