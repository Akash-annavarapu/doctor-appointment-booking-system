"use strict";

const MANUAL = require("./manual-baseline.json");
const STORIES = require("./user-stories.json");
const { checksForStory } = require("./browserCoverage");

function normalizeManual(category) {
  const normalized = String(category || "").toLowerCase();
  if (normalized === "positive") return "positive";
  if (normalized === "negative") return "negative";
  if (normalized === "boundary") return "boundary";
  if (normalized === "security" || normalized === "authorization") return "security";
  if (normalized === "state" || normalized === "concurrency") return normalized;
  return "other";
}

const TYPES = ["positive","negative","boundary","security","state","concurrency","other"];
function categoryCounts(items, category) {
  return Object.fromEntries(TYPES.map(type => [type, items.filter(item => category(item) === type).length]));
}

function compareGeneratedWithManual(storyId, generated) {
  const story = STORIES.find(item => item.id === storyId);
  if (!story || !Array.isArray(generated) || generated.length < 4 || generated.length > 8) {
    throw Error("A documented story and 4–8 genuine generated candidates are required.");
  }
  const manual = MANUAL.filter(item => item.useCase === story.useCase);
  const seen = new Set();
  let nearIdenticalTitles = 0;
  for (const item of generated) {
    if (!item || typeof item.title !== "string" ||
        typeof item.type !== "string" || !TYPES.includes(item.type) ||
        !["P0","P1","P2"].includes(item.priority)) {
      throw Error("Invalid generated case metadata for evaluation.");
    }
    const title = item.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seen.has(title)) nearIdenticalTitles++;
    seen.add(title);
  }
  const aiTypes = categoryCounts(generated, item => item.type);
  const manualTypes = categoryCounts(manual, item => normalizeManual(item.category));
  return {
    storyId: story.id, useCase: story.useCase, title: story.title,
    generatedBy: "MODEL_OUTPUT_PROVIDED_BY_SIGNED_LAB_RECEIPT",
    manualBaseline: "TEST_CASES from client/src/data/testCases.js; committed local snapshot",
    ai: {
      total: generated.length, categories: aiTypes,
      priorities: {
        P0: generated.filter(c => c.priority === "P0").length,
        P1: generated.filter(c => c.priority === "P1").length,
        P2: generated.filter(c => c.priority === "P2").length
      },
      linkedReadOnlyProbeCandidates: generated.filter(c => c.probeId && c.probeId !== "NONE").length,
      exactNormalizedDuplicateTitles: nearIdenticalTitles
    },
    manual: {
      total: manual.length, categories: manualTypes,
      caseIds: manual.map(c => c.id),
      examples: manual.map(({id,category,priority,scenario})=>({id,category,priority,scenario}))
    },
    categoryComparison: TYPES.filter(type => aiTypes[type] || manualTypes[type]).map(type => ({
      type, generated: aiTypes[type], manual: manualTypes[type]
    })),
    relatedPrewrittenBrowserChecks: checksForStory(storyId),
    interpretation: "Counts compare types and priorities for the same use case, NOT semantic coverage, correctness, test effectiveness or superiority. A reviewer must evaluate steps against each acceptance criterion. Browser checks are independent CI scenarios, not executions of these generated narratives."
  };
}

module.exports = { compareGeneratedWithManual, normalizeManual };
