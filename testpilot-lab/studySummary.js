"use strict";

// Aggregates reviewer-exported Lab comparisons. Never synthesizes scores or model output.
const REQUIRED_STORIES = Object.freeze(["US-001", "US-005", "US-017"]);

function summarizeEvaluations(exports, requiredStories = REQUIRED_STORIES) {
  if (!Array.isArray(exports) || exports.length !== requiredStories.length) {
    throw Error("Provide exactly one real Lab comparison export for each required story.");
  }
  const seen = new Set();
  const rows = exports.map(record => {
    if (!record || !requiredStories.includes(record.storyId) || seen.has(record.storyId)) {
      throw Error("Comparison exports contain a missing, duplicate or unexpected story.");
    }
    seen.add(record.storyId);
    if (record.generatedBy !== "MODEL_OUTPUT_PROVIDED_BY_SIGNED_LAB_RECEIPT" ||
        !Number.isInteger(record.ai?.total) || record.ai.total < 4 || record.ai.total > 8 ||
        !Number.isInteger(record.manual?.total) || record.manual.total < 1) {
      throw Error(record.storyId + ": a genuine signed-model comparison and manual baseline are required.");
    }
    const review = record.reviewerAssessment;
    if (!review || review.method !== "HUMAN_REVIEWED_ACCEPTANCE_CRITERIA" ||
        !Array.isArray(review.criteria) || review.criteria.length < 1) {
      throw Error(record.storyId + ": human acceptance-criterion assessment is missing.");
    }
    const permitted = new Set(["Covered", "Not covered"]);
    if (review.criteria.some(c => !permitted.has(c.ai) || !permitted.has(c.manual))) {
      throw Error(record.storyId + ": every criterion must be explicitly reviewed for both case sets.");
    }
    const total = review.criteria.length;
    const aiCovered = review.criteria.filter(c => c.ai === "Covered").length;
    const manualCovered = review.criteria.filter(c => c.manual === "Covered").length;
    return {
      storyId: record.storyId,
      useCase: record.useCase,
      aiCases: record.ai.total,
      manualCases: record.manual.total,
      aiDuplicates: record.ai.exactNormalizedDuplicateTitles,
      acceptanceCriteria: total,
      aiCovered,
      manualCovered,
      aiCoveragePercent: Math.round(1000 * aiCovered / total) / 10,
      manualCoveragePercent: Math.round(1000 * manualCovered / total) / 10,
      reviewerNotes: review.notes || ""
    };
  });
  rows.sort((a, b) => requiredStories.indexOf(a.storyId) - requiredStories.indexOf(b.storyId));
  const criteria = rows.reduce((sum, row) => sum + row.acceptanceCriteria, 0);
  const aiCovered = rows.reduce((sum, row) => sum + row.aiCovered, 0);
  const manualCovered = rows.reduce((sum, row) => sum + row.manualCovered, 0);
  return {
    studyStatus: "REVIEWED_SAMPLE_ONLY",
    storyCount: rows.length,
    acceptanceCriteria: criteria,
    aiCovered,
    manualCovered,
    aiCoveragePercent: Math.round(1000 * aiCovered / criteria) / 10,
    manualCoveragePercent: Math.round(1000 * manualCovered / criteria) / 10,
    rows,
    limitation: "Reviewer-rated acceptance-criteria coverage is not measured test execution, statistical superiority, or test correctness. The three stories are a purposive sample."
  };
}

if (require.main === module) {
  try {
    const fs = require("node:fs");
    const paths = process.argv.slice(2);
    if (paths.length !== REQUIRED_STORIES.length) throw Error("Usage: node testpilot-lab/studySummary.js <US-001-export.json> <US-005-export.json> <US-017-export.json>");
    const exports = paths.map(file => JSON.parse(fs.readFileSync(file, "utf8")));
    process.stdout.write(JSON.stringify(summarizeEvaluations(exports), null, 2) + "\n");
  } catch (error) {
    console.error("Evaluation not complete: " + error.message);
    process.exitCode = 1;
  }
}

module.exports = { summarizeEvaluations, REQUIRED_STORIES };
