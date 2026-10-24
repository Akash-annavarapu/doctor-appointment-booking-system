"use strict";
const fs = require("node:fs");
const { validateBrowserSelection } = require("../../testpilot-lab/browserCoverage");

function select(storyId, testId) {
  return validateBrowserSelection(storyId, testId);
}
if (require.main === module) {
  try {
    const selection = select(process.env.STORY_ID, process.env.BROWSER_CHECK_ID);
    if (!process.env.GITHUB_OUTPUT) throw Error("GITHUB_OUTPUT must be set for Actions.");
    fs.appendFileSync(process.env.GITHUB_OUTPUT, "test_grep=^" + selection.testId + " " + "\n");
    fs.appendFileSync(process.env.GITHUB_OUTPUT, "selected_id=" + selection.testId + "\n");
    console.log("Selected prewritten check " + selection.testId + " for " +
      selection.storyId + "; no model-supplied code or production writes.");
  } catch (error) {
    console.error("Rejected unapproved browser run request: " + error.message);
    process.exitCode = 1;
  }
}
module.exports = { select };
