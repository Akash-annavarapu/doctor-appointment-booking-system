"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { compareGeneratedWithManual, normalizeManual } = require("../evaluation");
const manual = require("../manual-baseline.json");
const { validateBrowserSelection, checksForStory } = require("../browserCoverage");
const { select } = require("../../e2e/scripts/selectReviewedCase.cjs");
const { buildTraceability } = require("../traceability");

function candidates() {
  return [
    { id:"AI-001", title:"Public doctor listing is readable", type:"positive",
      priority:"P0", probeId:"approved-doctor-list" },
    { id:"AI-002", title:"Pending doctor must remain hidden", type:"negative",
      priority:"P1", probeId:"NONE" },
    { id:"AI-003", title:"Doctor list handles empty results", type:"boundary",
      priority:"P1", probeId:"NONE" },
    { id:"AI-004", title:"Doctor list handles empty results", type:"boundary",
      priority:"P2", probeId:"NONE" }
  ];
}

test("snapshot matches all 36 authored, manually designed healthcare cases", () => {
  const src = fs.readFileSync(path.join(__dirname, "../../client/src/data/testCases.js"), "utf8");
  const json = src.split("export const TEST_CASES = ")[1].split(";\n")[0];
  const liveCatalog = JSON.parse(json);
  assert.equal(manual.length, 36);
  assert.deepEqual(manual.map(({id,useCase,category,priority,scenario})=>
    ({id,useCase,category,priority,scenario})),
    liveCatalog.map(({id,useCase,category,priority,scenario})=>
      ({id,useCase,category,priority,scenario})));
});

test("comparison uses real case metadata and relevant manual use case, without fake pass claims", () => {
  const result = compareGeneratedWithManual("US-005", candidates());
  assert.equal(result.useCase, "UC-04");
  assert.equal(result.ai.total, 4);
  assert.equal(result.manual.total, 3);
  assert.equal(result.ai.priorities.P0, 1);
  assert.equal(result.ai.linkedReadOnlyProbeCandidates, 1);
  assert.equal(result.ai.exactNormalizedDuplicateTitles, 1);
  assert.equal(result.ai.categories.boundary, 2);
  assert.equal(result.manual.caseIds.includes("TP-011"), true);
  assert.deepEqual(result.relatedPrewrittenBrowserChecks.map(x=>x.testId),["TC-0501","TC-0502"]);
  assert.match(result.interpretation, /NOT semantic coverage/);
  assert.equal(JSON.stringify(result).includes('"PASS"'), false);
});

test("comparison rejects unknown stories and non-model-ready test sets", () => {
  assert.throws(()=>compareGeneratedWithManual("US-999",candidates()),/documented story/);
  assert.throws(()=>compareGeneratedWithManual("US-005",[candidates()[0]]),/4–8/);
  assert.throws(()=>compareGeneratedWithManual("US-005",[
    {...candidates()[0],priority:"P99"}, ...candidates().slice(1)
  ]),/Invalid generated/);
  assert.equal(normalizeManual("Authorization"),"security");
  assert.equal(normalizeManual("Empty data"),"other");
});

test("only fixed source-reviewed browser checks can be selected", () => {
  const selected=validateBrowserSelection("US-005","TC-0502");
  assert.equal(selected.executionMode,"ISOLATED_SYNTHETIC_CHROMIUM");
  assert.equal(select("US-005","TC-0502").testId,"TC-0502");
  assert.equal(checksForStory("US-008").length,0);
  assert.throws(()=>select("US-017","TC-0502"),/No source-reviewed/);
  assert.throws(()=>select("US-005","TC-9999"),/No source-reviewed/);
  assert.throws(()=>select("US-005","TC-0502; echo hacked"),/No source-reviewed/);
  assert.throws(()=>select("US-005","../../server"),/No source-reviewed/);
});


test("traceability covers all 25 stories, 15 use cases, 36 manual case designs", () => {
  const output=buildTraceability();
  assert.equal(output.summary.documentedStories,25);
  assert.equal(output.summary.useCases,15);
  assert.equal(output.summary.designedManualCases,36);
  assert.equal(output.rows.length,25);
  assert.equal(output.summary.storiesWithDesignedCases,25);
  const doctorList=output.rows.find(row=>row.id==="US-005");
  assert.deepEqual(doctorList.fixedPlaywrightIds,["TC-0501","TC-0502"]);
  assert.ok(doctorList.readOnlyProbeIds.includes("approved-doctor-list"));
  assert.ok(doctorList.manualCaseIds.includes("TP-011"));
  const booking=output.rows.find(row=>row.id==="US-017");
  assert.deepEqual(booking.fixedPlaywrightIds,["TC-0503"]);
  assert.equal(booking.readOnlyProbeIds.length,0);
  assert.match(output.warning,/not PASS\/FAIL/);
});
