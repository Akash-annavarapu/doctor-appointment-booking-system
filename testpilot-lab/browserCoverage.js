"use strict";

// Source-reviewed, FIXED Playwright checks. Neither users nor AI may supply scripts.
// These support related story workflows; they do not prove an arbitrary AI narrative passed.
const WORKFLOW_URL = "https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/workflows/reviewed-playwright.yml";
const CHECKS = Object.freeze([
  { storyId:"US-001", testId:"TC-0508", description:"Registration required fields are enforced by browser validation (synthetic only)" },
  { storyId:"US-001", testId:"TC-0509", description:"Seven-character registration password is blocked by browser validation (synthetic only)" },
  { storyId:"US-002", testId:"TC-0507", description:"Empty login form is rejected by browser validation" },
  { storyId:"US-002", testId:"TC-0510", description:"Invalid email format prevents login form submission (synthetic only)" },
  { storyId:"US-004", testId:"TC-0506", description:"Unauthenticated access to the doctor directory redirects to login" },
  { storyId:"US-005", testId:"TC-0501", description:"The healthcare homepage renders its synthetic doctor cards" },
  { storyId:"US-005", testId:"TC-0502", description:"Doctor search and specialty filters narrow synthetic results" },
  { storyId:"US-007", testId:"TC-0504", description:"Date-specific available-slot preview shows synthetic slots" },
  { storyId:"US-017", testId:"TC-0503", description:"Guest appointment booking requests redirect to login without modifying data" }
].map(item => Object.freeze(item)));

function checksForStory(storyId) {
  return CHECKS.filter(item => item.storyId === storyId).map(item => ({ ...item }));
}

function validateBrowserSelection(storyId, testId) {
  if (typeof storyId !== "string" || typeof testId !== "string") {
    throw Error("A documented story and a fixed Playwright test ID are required.");
  }
  const found = CHECKS.find(item => item.storyId === storyId && item.testId === testId);
  if (!found) throw Error("No source-reviewed Playwright check is available for this story/test combination.");
  return { ...found, executionMode:"ISOLATED_SYNTHETIC_CHROMIUM", workflowUrl:WORKFLOW_URL };
}

module.exports = { CHECKS, WORKFLOW_URL, checksForStory, validateBrowserSelection };
