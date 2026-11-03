"use strict";

/**
 * Offline, reproducible audit of previously observed TestPilot evidence.
 *
 * IMPORTANT: This is NOT a model call, a human review, or a live Playwright
 * execution. The source JSON preserves preliminary assistant judgments;
 * only a real, separate participant study can produce final human ratings.
 */
const fs = require("node:fs");
const path = require("node:path");
const record = require("./observed-case-comparison.json");
const stories = require("./user-stories.json");
const manual = require("./manual-baseline.json");

function computeEvidenceSummary(input = record) {
  if (!input || input.schema !== "testpilot-observed-case-comparison-v1" ||
      input.assessment?.status !== "PRELIMINARY_ASSISTANT_TECHNICAL_REVIEW_UNSIGNED" ||
      input.assessment?.independentlyHumanReviewed !== false ||
      input.assessment?.humanRatingsRecorded !== false) {
    throw Error("Missing or mislabelled preliminary, unsigned assessment.");
  }
  if (!Array.isArray(input.stories) || input.stories.length !== 3) {
    throw Error("Require exactly the three published study stories.");
  }

  const expected = ["US-001", "US-005", "US-017"];
  const summary = input.stories.map((row, i) => {
    if (row.storyId !== expected[i]) throw Error("Unexpected or out-of-order study story.");
    const story = stories.find(s => s.id === row.storyId);
    if (!story || row.criteria?.length !== story.acceptanceCriteria.length) {
      throw Error(row.storyId + ": missing acceptance criteria.");
    }
    const trueManual = manual.filter(c => c.useCase === story.useCase);
    if (trueManual.length !== row.manualCaseIds?.length ||
        trueManual.some((c,j) => c.id !== row.manualCaseIds[j])) {
      throw Error(row.storyId + ": manual baseline has drifted from the documented audit.");
    }
    if (!Number.isInteger(row.aiCaseCount) || row.aiCaseCount < 4 || row.aiCaseCount > 8) {
      throw Error(row.storyId + ": model candidate count invalid.");
    }
    const allowed = new Set(["covered", "not_covered"]);
    let aiCovered = 0, manualCovered = 0;
    for (const [j,c] of row.criteria.entries()) {
      if (c.acceptanceCriterion !== story.acceptanceCriteria[j] ||
          !allowed.has(c.ai) || !allowed.has(c.manual) ||
          typeof c.basis !== "string" || c.basis.length < 40) {
        throw Error(row.storyId + ": unsupported or ungrounded preliminary criterion.");
      }
      aiCovered += Number(c.ai === "covered");
      manualCovered += Number(c.manual === "covered");
    }
    return {storyId:row.storyId, aiCases:row.aiCaseCount,
      manualCases:trueManual.length,criteria:row.criteria.length,
      aiCovered,manualCovered};
  });

  const execution=input.measuredExecution;
  if (execution?.runId !== 41327612679 ||
      execution?.playwrightMainSuite?.passed !== 29 ||
      execution?.playwrightMainSuite?.skipped !== 1 ||
      execution?.playwrightMainSuite?.failed !== 0 ||
      execution?.separateSyntheticRecipeFixture?.passed !== 6 ||
      execution?.separateSyntheticRecipeFixture?.humanApproval !== false ||
      execution?.generatedCaseMappings?.length !== 4) {
    throw Error("Observed CI run reference differs from the verified archived evidence.");
  }
  const fixedSource=fs.readFileSync(path.join(__dirname,
    "../e2e/tests/generated-booking.api.spec.cjs"),"utf8");
  const ids=new Set();
  for(const [i,c] of execution.generatedCaseMappings.entries()){
    if(c.caseId !== "AI-00" + (i+1) || c.status !== "PASS" ||
        ids.has(c.caseId) || !fixedSource.includes('test("' + c.caseId + " ")) {
      throw Error("Missing source-reviewed Playwright mapping: "+c.caseId);
    }
    ids.add(c.caseId);
  }

  const total = (key) => summary.reduce((sum,row)=>sum+row[key],0);
  const pct = (n,d) => Math.round(1000*n/d)/10;
  return {
    status:"PRELIMINARY_TECHNICAL_ASSESSMENT_UNVALIDATED_BY_HUMANS",
    assessedAt:input.asOf,
    aiCases:total("aiCases"),manualCases:total("manualCases"),
    acceptanceCriteria:total("criteria"),
    aiCovered:total("aiCovered"),manualCovered:total("manualCovered"),
    aiDesignCoveragePercent:pct(total("aiCovered"),total("criteria")),
    manualDesignCoveragePercent:pct(total("manualCovered"),total("criteria")),
    byStory:summary,
    execution:{
      source:"Genuine Gemini US-017 scenario intents mapped to fixed Playwright assertions",
      runUrl:execution.workflowUrl,
      independentlyReviewed:false,
      mappedGeminiIntentsPassed:execution.generatedCaseMappings.length,
      mainPlaywrightPassed:execution.playwrightMainSuite.passed,
      mainPlaywrightSkipped:execution.playwrightMainSuite.skipped,
      syntheticRecipePassedSeparately:execution.separateSyntheticRecipeFixture.passed
    },
    limitation:"This script recomputes a published preliminary comparison and checks source traceability. It neither executes tests nor establishes independent human validity, model superiority, or raw Gemini-output provenance."
  };
}

if (require.main === module) {
  try {process.stdout.write(JSON.stringify(computeEvidenceSummary(),null,2)+"\n");}
  catch(error){console.error("Cannot audit observed evidence: "+error.message);process.exitCode=1;}
}

module.exports={computeEvidenceSummary};
