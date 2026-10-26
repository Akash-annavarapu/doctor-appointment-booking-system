"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { summarizeEvaluations } = require("./studySummary");

function sample(storyId, ai, manual) {
  return {
    storyId, useCase:"UC-TEST",
    generatedBy:"MODEL_OUTPUT_PROVIDED_BY_SIGNED_LAB_RECEIPT",
    ai:{ total:5, exactNormalizedDuplicateTitles:0 },
    manual:{ total:3 },
    reviewerAssessment:{
      method:"HUMAN_REVIEWED_ACCEPTANCE_CRITERIA",
      criteria:[
        { criterion:"Criterion 1", ai, manual },
        { criterion:"Criterion 2", ai:"Covered", manual:"Not covered" }
      ],
      notes:"Synthetic unit-test reviewer stub; not a real experiment."
    }
  };
}
const records = () => [
  sample("US-001","Covered","Covered"),
  sample("US-005","Not covered","Covered"),
  sample("US-017","Covered","Not covered")
];

test("aggregates explicitly reviewed criteria without inventing execution results", () => {
  const result = summarizeEvaluations(records());
  assert.equal(result.storyCount,3);
  assert.equal(result.acceptanceCriteria,6);
  assert.equal(result.aiCovered,5);
  assert.equal(result.manualCovered,2);
  assert.equal(result.aiCoveragePercent,83.3);
  assert.equal(result.manualCoveragePercent,33.3);
  assert.equal(result.studyStatus,"REVIEWED_SAMPLE_ONLY");
});

test("rejects unreviewed criteria and duplicate stories", () => {
  const unreviewed=records();
  unreviewed[0].reviewerAssessment.criteria[0].ai="Not reviewed";
  assert.throws(() => summarizeEvaluations(unreviewed), /explicitly reviewed/);
  const duplicate=records();
  duplicate[1].storyId="US-001";
  assert.throws(() => summarizeEvaluations(duplicate), /duplicate/);
});

test("rejects placeholder results without a signed-model comparison", () => {
  const invalid=records();
  invalid[0].generatedBy="MOCKED";
  assert.throws(() => summarizeEvaluations(invalid), /genuine signed-model/);
});
