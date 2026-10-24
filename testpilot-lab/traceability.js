"use strict";
const STORIES = require("./user-stories.json");
const MANUAL = require("./manual-baseline.json");
const { CHECKS: liveChecks } = require("./verifiedChecks");
const { CHECKS: browserChecks } = require("./browserCoverage");
function buildTraceability() {
  const byUseCase = new Map();
  for (const item of MANUAL) {
    if (!byUseCase.has(item.useCase)) byUseCase.set(item.useCase,[]);
    byUseCase.get(item.useCase).push(item.id);
  }
  const rows=STORIES.map(story=>({
    id:story.id, title:story.title, actor:story.actor,useCase:story.useCase,
    manualCaseIds:byUseCase.get(story.useCase)||[],
    readOnlyProbeIds:liveChecks.filter(c=>c.stories.includes(story.id)).map(c=>c.id),
    fixedPlaywrightIds:browserChecks.filter(c=>c.storyId===story.id).map(c=>c.testId)
  }));
  const useCases=[...new Set(STORIES.map(s=>s.useCase))];
  if(rows.some(r=>!r.manualCaseIds.length)||MANUAL.some(m=>!useCases.includes(m.useCase)))
    throw Error("Story-to-case baseline is out of sync.");
  return {
    source:"COMMITTED_REPOSITORY_DESIGN_AND_ALLOWLISTS",
    summary:{
      documentedStories:STORIES.length,useCases:useCases.length,
      designedManualCases:MANUAL.length,
      storiesWithDesignedCases:rows.filter(r=>r.manualCaseIds.length).length,
      storiesWithLiveProbe:rows.filter(r=>r.readOnlyProbeIds.length).length,
      storiesWithFixedPlaywright:rows.filter(r=>r.fixedPlaywrightIds.length).length
    },
    rows,
    warning:"A case-to-story mapping indicates design or eligible test coverage, not PASS/FAIL. Only actual execution reports may claim test outcomes."
  };
}
module.exports={buildTraceability};
