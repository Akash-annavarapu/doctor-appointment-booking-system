"use strict";

// Signed human-review decisions: the original model cases remain immutable and
// verifiable with their generation receipt. Edits are stored as separate reviewed
// revisions, never mistaken for the model's output or executed as model code.
const crypto = require("node:crypto");
const secret = crypto.randomBytes(32);
const TTL = 30 * 60 * 1000;
const STATES = ["APPROVED", "REJECTED", "DRAFT"];
const TEXT_FIELDS = ["title", "preconditions", "testData", "expectedResult"];

function validateReview(cases, decisions) {
  if (!Array.isArray(cases) || cases.length < 4 || cases.length > 8 ||
      !Array.isArray(decisions) || decisions.length !== cases.length) {
    throw Error("Record a review decision for every generated case.");
  }
  const index = new Map(cases.map(c => [c.id, c]));
  if (index.size !== cases.length) throw Error("Original case IDs must be unique.");
  const used = new Set();
  const rows = decisions.map(record => {
    if (!record || typeof record !== "object" || Array.isArray(record) ||
        Object.keys(record).some(k => !["id", "decision", "notes", "edits"].includes(k)) ||
        !index.has(record.id) || used.has(record.id) || !STATES.includes(record.decision)) {
      throw Error("Review includes an unknown, duplicate or invalid decision.");
    }
    used.add(record.id);
    const notes = record.notes === undefined ? "" : record.notes;
    if (typeof notes !== "string" || notes.length > 1000) throw Error("Reviewer notes are too long.");
    const edits = record.edits || {};
    if (!edits || typeof edits !== "object" || Array.isArray(edits) ||
        Object.keys(edits).some(k => ![...TEXT_FIELDS, "steps"].includes(k))) {
      throw Error("Only test case narrative fields can be edited.");
    }
    const original = index.get(record.id);
    const revised = { ...original };
    for (const field of TEXT_FIELDS) {
      if (!Object.hasOwn(edits, field)) continue;
      if (typeof edits[field] !== "string" || !edits[field].trim() ||
          edits[field].length > 650) throw Error("Invalid reviewed " + field + ".");
      revised[field] = edits[field].trim();
    }
    if (Object.hasOwn(edits, "steps")) {
      if (!Array.isArray(edits.steps) || edits.steps.length < 1 || edits.steps.length > 8 ||
          !edits.steps.every(s => typeof s === "string" && s.trim() && s.length <= 300)) {
        throw Error("A reviewed case must contain 1–8 clear test steps.");
      }
      revised.steps = edits.steps.map(s => s.trim());
    }
    const actualEdits = {};
    for (const field of [...TEXT_FIELDS, "steps"]) {
      if (Object.hasOwn(edits, field)) actualEdits[field] = revised[field];
    }
    return {
      id: record.id, decision: record.decision, notes,
      edits: actualEdits,
      case: { ...revised, reviewDecision: record.decision,
        reviewed: record.decision !== "DRAFT", executionStatus: "NOT_RUN" }
    };
  });
  return {
    decisions: rows.map(({ id, decision, notes, edits }) => ({ id, decision, notes, edits })),
    cases: rows.map(row => row.case),
    summary: Object.fromEntries(STATES.map(key =>
      [key.toLowerCase(), rows.filter(row => row.decision === key).length]))
  };
}

function mac(body) {
  return crypto.createHmac("sha256", secret).update(body).digest("base64url");
}
function issueReviewReceipt(storyId, targetUrl, generationReceipt, decisions, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({
    storyId, targetUrl,
    generationDigest: crypto.createHash("sha256").update(generationReceipt).digest("hex"),
    decisionsDigest: crypto.createHash("sha256").update(JSON.stringify(decisions)).digest("hex"),
    issuedAt: now, nonce: crypto.randomUUID()
  })).toString("base64url");
  return body + "." + mac(body);
}
function verifyReviewReceipt(receipt, storyId, targetUrl, generationReceipt, decisions, now = Date.now()) {
  if (typeof receipt !== "string" || receipt.length > 18000 ||
      !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(receipt)) {
    throw Error("Missing or invalid signed review receipt.");
  }
  const [body, signature] = receipt.split(".");
  const expected = Buffer.from(mac(body), "base64url");
  const actual = Buffer.from(signature, "base64url");
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    throw Error("Review receipt signature is invalid.");
  }
  let payload;
  try { payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")); }
  catch { throw Error("Invalid reviewed decision receipt."); }
  if (!payload || payload.storyId !== storyId || payload.targetUrl !== targetUrl ||
      payload.generationDigest !== crypto.createHash("sha256").update(generationReceipt).digest("hex") ||
      payload.decisionsDigest !== crypto.createHash("sha256").update(JSON.stringify(decisions)).digest("hex") ||
      !Number.isFinite(payload.issuedAt) || payload.issuedAt > now ||
      now - payload.issuedAt > TTL) {
    throw Error("Review changed, expired or does not match the generation.");
  }
}
function approvedIds(cases, decisions, selectedIds) {
  const validated = validateReview(cases, decisions);
  if (!Array.isArray(selectedIds) || selectedIds.length < 1 ||
      selectedIds.length > cases.length || new Set(selectedIds).size !== selectedIds.length) {
    throw Error("Select at least one approved generated case.");
  }
  const approved = new Set(validated.decisions
    .filter(item => item.decision === "APPROVED").map(item => item.id));
  if (!selectedIds.every(id => approved.has(id))) {
    throw Error("Only explicitly approved, unchanged review decisions may execute.");
  }
  return selectedIds;
}

module.exports = { validateReview, issueReviewReceipt, verifyReviewReceipt, approvedIds };
