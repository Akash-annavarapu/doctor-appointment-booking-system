"use strict";

// A study recorder, NOT an authentication provider. Only genuine participants
// can supply human judgments and usability observations.
const crypto = require("node:crypto");
const STATES = ["covered", "not_covered", "not_reviewed"];
function cleanShort(v, max = 500) {
  if (typeof v !== "string" || !v.trim() || v.length > max) throw Error("Missing or invalid participant response.");
  return v.trim();
}
function validateIndependentReview(input, criteria) {
  if (!input || !Array.isArray(criteria) || !criteria.length || criteria.length > 30) throw Error("Invalid reviewed criteria.");
  const reviewer = cleanShort(input.reviewer, 60);
  const caseSetHash = cleanShort(input.caseSetHash, 64);
  if (!/^[a-f0-9]{64}$/i.test(caseSetHash)) throw Error("Invalid source case hash.");
  if (!Array.isArray(input.assessments) || input.assessments.length !== criteria.length)
    throw Error("All criteria must have an explicit review state.");
  const assessments = input.assessments.map((item, i) => {
    if (item.criterion !== criteria[i] || !STATES.includes(item.ai) ||
        !STATES.includes(item.manual) || typeof item.evidence !== "string" ||
        item.evidence.length > 1000 ||
        ((item.ai !== "not_reviewed" || item.manual !== "not_reviewed") && !item.evidence.trim()))
      throw Error("Reviewer must cite case IDs/steps for every coverage judgment.");
    return { criterion: item.criterion, ai: item.ai, manual: item.manual, evidence: item.evidence.trim() };
  });
  return { reviewer, caseSetHash, assessments, recordedAt: new Date().toISOString(),
    identityVerified: false, reviewerEntered: true };
}
function compareIndependentReviews(first, second) {
  if (!first || !second || first.reviewer.toLowerCase() === second.reviewer.toLowerCase())
    throw Error("Two distinct reviewer identifiers are required.");
  if (first.caseSetHash !== second.caseSetHash ||
      first.assessments.length !== second.assessments.length) throw Error("Review sources differ.");
  const disagreements = [];
  first.assessments.forEach((row, i) => {
    const other = second.assessments[i];
    if (row.criterion !== other.criterion) throw Error("Acceptance criteria order differs.");
    if (row.ai !== other.ai || row.manual !== other.manual) disagreements.push({
      index: i + 1, criterion: row.criterion,
      first: { ai: row.ai, manual: row.manual },
      second: { ai: other.ai, manual: other.manual }
    });
  });
  return { reviewers: [first.reviewer, second.reviewer], disagreements,
    agreed: first.assessments.length - disagreements.length,
    total: first.assessments.length, finalSignOff: false,
    statement: "Individual reviews are self-declared; disagreement resolution and sign-off must be performed by the participants." };
}
const TASKS = ["enter_story", "generate", "edit_review", "approve_reject", "inspect_report", "export"];
function validatePeerSession(input) {
  if (!input || input.consent !== true) throw Error("Participant consent is required.");
  const participant = cleanShort(input.participant, 60);
  const browser = cleanShort(input.browser, 80);
  const feedback = cleanShort(input.feedback, 1500);
  if (!Number.isInteger(input.durationSeconds) || input.durationSeconds < 1 ||
      input.durationSeconds > 21600 || !Array.isArray(input.tasks) || input.tasks.length !== TASKS.length)
    throw Error("A measured session duration and task checklist are required.");
  if (!input.tasks.every((t, i) => t.task === TASKS[i] &&
      ["completed", "blocked", "not_attempted"].includes(t.result)))
    throw Error("Invalid usability tasks.");
  return { participant, browser, consent: true, durationSeconds: input.durationSeconds,
    tasks: input.tasks.map(x => ({ task: x.task, result: x.result })), feedback,
    recordedAt: new Date().toISOString(), identityVerified: false,
    source: "participant-entered-observation-not-automated-test" };
}
function hashCases(cases) {
  if (!Array.isArray(cases) || !cases.length) throw Error("Missing generated cases.");
  return crypto.createHash("sha256").update(JSON.stringify(cases)).digest("hex");
}
module.exports = { validateIndependentReview, compareIndependentReviews,
  validatePeerSession, hashCases, TASKS };
