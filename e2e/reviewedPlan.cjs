"use strict";
// A data-only execution contract. This module NEVER evaluates model-authored
// JavaScript, selectors, URLs or commands. All execution is on local synthetic
// records and a fixed allowlisted healthcare API in the isolated Playwright job.
const RECIPES = Object.freeze({
  register_valid: { storyId:"US-001", label:"Register valid synthetic patient", category:"positive" },
  register_weak_password: { storyId:"US-001", label:"Reject synthetic seven-character password", category:"negative" },
  register_boundary_password: { storyId:"US-001", label:"Accept exactly eight characters", category:"edge" },
  approved_doctor_only: { storyId:"US-005", label:"Return only approved doctors", category:"positive" },
  empty_doctor_catalog: { storyId:"US-005", label:"Return empty approved doctor catalog", category:"edge" },
  booking_valid: { storyId:"US-017", label:"Book an available synthetic slot", category:"positive" },
  booking_conflict: { storyId:"US-017", label:"Reject second booking at occupied slot", category:"negative" },
  booking_missing_fields: { storyId:"US-017", label:"Reject missing booking parameters", category:"negative" },
  booking_unauthenticated: { storyId:"US-017", label:"Deny unauthenticated booking", category:"negative" },
  booking_concurrent: { storyId:"US-017", label:"Reject concurrent double booking", category:"edge" },
  booking_outside_hours: { storyId:"US-017", label:"Reject out-of-hours booking", category:"edge" }
});
function validatePlan(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest) ||
      !["reviewed-isolated-plan-v1"].includes(manifest.format) ||
      !Array.isArray(manifest.cases) || !manifest.cases.length || manifest.cases.length > 8 ||
      typeof manifest.reviewedBy !== "string" || !manifest.reviewedBy.trim() ||
      manifest.reviewedBy.length > 60 || typeof manifest.storyId !== "string") {
    throw Error("Invalid signed-off isolated execution manifest.");
  }
  const seen = new Set();
  const cases = manifest.cases.map(item => {
    if (!item || !/^AI-\d{3}$/.test(item.id) || seen.has(item.id) ||
        item.decision !== "APPROVED" || typeof item.recipe !== "string" ||
        !Object.hasOwn(RECIPES, item.recipe) ||
        RECIPES[item.recipe].storyId !== manifest.storyId ||
        typeof item.title !== "string" || !item.title.trim() || item.title.length > 140 ||
        Object.keys(item).some(k => !["id", "title", "decision", "recipe"].includes(k))) {
      throw Error("Plan includes an unsupported, rejected or duplicate case recipe.");
    }
    seen.add(item.id);
    return { id:item.id, title:item.title.trim(), recipe:item.recipe, ...RECIPES[item.recipe] };
  });
  if (Object.keys(manifest).some(k => !["format","reviewedBy","storyId","cases","note"].includes(k)))
    throw Error("Arbitrary executable fields are prohibited.");
  return { format:manifest.format, storyId:manifest.storyId, reviewedBy:manifest.reviewedBy.trim(), cases,
    scope:"ISOLATED_SOURCE_REVIEWED_RECIPE_ONLY",
    note:"Only selected reviewed source-grounded recipes execute; narrative text is not executable code." };
}
module.exports={ RECIPES, validatePlan };
