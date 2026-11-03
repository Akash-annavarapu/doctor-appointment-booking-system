"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const observed = require("../observed-case-comparison.json");
const {computeEvidenceSummary} = require("../observedEvidence");

test("archived Gemini/36-case baseline yields source-grounded preliminary 4-of-6 vs 6-of-6",()=>{
  const summary=computeEvidenceSummary();
  assert.equal(summary.status,"PRELIMINARY_TECHNICAL_ASSESSMENT_UNVALIDATED_BY_HUMANS");
  assert.equal(summary.aiCases,12);
  assert.equal(summary.manualCases,13);
  assert.equal(summary.acceptanceCriteria,6);
  assert.equal(summary.aiCovered,4);
  assert.equal(summary.manualCovered,6);
  assert.equal(summary.aiDesignCoveragePercent,66.7);
  assert.equal(summary.manualDesignCoveragePercent,100);
  assert.deepEqual(summary.byStory.map(row=>row.aiCovered),[2,0,2]);
  assert.equal(summary.execution.mappedGeminiIntentsPassed,4);
  assert.equal(summary.execution.mainPlaywrightPassed,29);
  assert.equal(summary.execution.syntheticRecipePassedSeparately,6);
  assert.equal(summary.execution.independentlyReviewed,false);
});

test("cannot silently mark preliminary assistant scoring as human-reviewed",()=>{
  const changed=structuredClone(observed);
  changed.assessment.independentlyHumanReviewed=true;
  assert.throws(()=>computeEvidenceSummary(changed),/unsigned assessment/);
});

test("detects altered baseline and unsupported CI case mappings",()=>{
  const changed=structuredClone(observed);
  changed.stories[2].manualCaseIds[0]="TP-999";
  assert.throws(()=>computeEvidenceSummary(changed),/baseline has drifted/);
  const changed2=structuredClone(observed);
  changed2.measuredExecution.generatedCaseMappings[0].caseId="AI-900";
  assert.throws(()=>computeEvidenceSummary(changed2),/source-reviewed Playwright mapping/);
});

test("rejects invented acceptance criteria and scores",()=>{
  const changed=structuredClone(observed);
  changed.stories[1].criteria[0].ai="coveredish";
  assert.throws(()=>computeEvidenceSummary(changed),/unsupported or ungrounded/);
});
