"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { handle, FRONTEND } = require("../server");
const { verifyReceipt } = require("../generatedCaseRunner");
const archive = require("../archive-us001-review.json");

test("restore archived genuine US-001 run without recreating human approval", async () => {
  const former = process.env.LAB_ACCESS_CODE;
  process.env.LAB_ACCESS_CODE = "synthetic-test-only-lab-access-code";
  const server = http.createServer((req, res) => handle(req, res));
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = "http://127.0.0.1:" + server.address().port;
  async function post(body) {
    const reply = await fetch(origin + "/api/import-review-draft", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    return { status: reply.status, data: await reply.json() };
  }
  try {
    const forbidden = await post({ storyId: "US-001", accessCode: "incorrect" });
    assert.equal(forbidden.status, 401);
    const wrongStory = await post({ storyId: "US-005", accessCode: process.env.LAB_ACCESS_CODE });
    assert.equal(wrongStory.status, 400);

    const response = await post({ storyId: "US-001", accessCode: process.env.LAB_ACCESS_CODE });
    assert.equal(response.status, 200);
    assert.equal(response.data.importedArchive, true);
    assert.equal(response.data.generatedBy, "Google Gemini");
    assert.equal(response.data.generatedAt, archive.originalModelOutput.generatedAt);
    assert.equal(response.data.targetUrl, FRONTEND + "/");
    assert.equal(response.data.cases.length, 4);
    assert.equal(response.data.proposedCaseReviews.length, 4);
    assert.equal(response.data.proposedAcceptanceCriteriaNotes.length, 2);
    assert.deepEqual(response.data.cases, archive.originalModelOutput.cases);
    assert.ok(response.data.cases.every(c => c.executionStatus === "NOT_RUN" && c.reviewed === false));
    assert.ok(response.data.proposedCaseReviews.every(d => d.decisionSuggestion === "REVISE_BEFORE_APPROVAL"));
    assert.doesNotThrow(() => verifyReceipt(response.data.receipt, "US-001",
      FRONTEND + "/", response.data.cases));

    // These suggestions never impersonate a human's saved review.
    assert.equal(response.data.reviewedBy, undefined);
    assert.equal(response.data.humanApproved, undefined);
    assert.equal(response.data.originalModelOutput, undefined);
    assert.equal(response.data.archiveStudyStatus,
      "ARCHIVED_REAL_GEMINI_OUTPUT_WITH_AI_PREPARED_DRAFT");
  } finally {
    if (former === undefined) delete process.env.LAB_ACCESS_CODE;
    else process.env.LAB_ACCESS_CODE = former;
    await new Promise(resolve => server.close(resolve));
  }
});
