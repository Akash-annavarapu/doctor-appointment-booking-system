const fs = require("node:fs/promises");
"use strict";
const { test, expect } = require("@playwright/test");

// UI-only tests: local Lab has no API keys and cannot invoke paid/free models.
// These assertions never create bookings or change healthcare records.
test.use({ baseURL: "http://127.0.0.1:4188" });

test("TC-0508 Figma-inspired dashboard displays the testing workflow and evidence boundary", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Design tests.*Verify with evidence/i })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Dashboard sections" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Testing workflow" })).toBeVisible();
  await expect(page.locator("#story-count")).toHaveText("25");
  await expect(page.locator("#ai-case-count")).toHaveText("0");
  await expect(page.getByText("Verified Playwright tests", { exact: true })).toBeVisible();
  await expect(page.getByText("Designed and executed are different.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Generate AI test cases/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Measured CI reports" })).toBeVisible();
});

test("TC-0509 selecting an existing user story updates its editable acceptance context", async ({ page }) => {
  await page.goto("/");
  const select = page.locator("#story-select");
  await expect(select.locator("option")).toHaveCount(25);
  await select.selectOption("US-005");
  const original = await page.locator("#story-input").inputValue();
  await expect(page.locator("#story-meta")).toContainText("/api/v1/doctor/all");
  await select.selectOption("US-006");
  await expect(page.locator("#story-input")).not.toHaveValue(original);
  await expect(page.locator("#story-input")).toHaveValue(/As a /);
  await expect(page.locator("#story-meta")).toContainText("Acceptance criteria");
});

test("TC-0510 missing private AI configuration is disclosed without exposing secrets", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#ai-setup-status")).toContainText("GEMINI_API_KEY");
  await expect(page.locator("#ai-nav-status")).toHaveText("AI setup needed");
  await expect(page.locator("#ai-case-count")).toHaveText("0");
  await expect(page.locator("#result-count")).toHaveText("0 candidates");
  await expect(page.locator("#results-footer")).toBeHidden();
  // A user may inspect/review even when free-tier Gemini hasn't been connected.
  await expect(page.getByRole("button", { name: /Inspect live application/i })).toBeEnabled();
});

test("TC-0511 mobile dashboard avoids sideways scrolling and preserves both panels", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Choose a feature" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Generated test cases" })).toBeVisible();
  await expect(page.locator("#story-select").locator("option")).toHaveCount(25);
  const horizontalOverflow = await page.evaluate(
    () => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
  );
  expect(horizontalOverflow).toBeLessThanOrEqual(1);
});


test("TC-0514 Lab compares mock model output to manual cases and prepares human-reviewed browser checks", async ({ page }) => {
  const makeCase = n => ({
    id: "AI-" + String(n).padStart(3, "0"),
    title: "Synthetic test suggestion " + n, type: n === 1 ? "positive" : "negative",
    priority: n === 1 ? "P0" : "P1", preconditions: "Mock fixture",
    steps: ["Inspect synthetic data"], testData: "No live patient data",
    expectedResult: "Fixture assertion", probeId: n === 1 ? "approved-doctor-list" : "NONE",
    reviewed: false, executionStatus: "NOT_RUN"
  });
  await page.route("**/api/generate", route => route.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({
      success: true, storyId: "US-005",
      targetUrl: "https://doctor-appointment-frontend-9dbs.onrender.com/",
      receipt: "synthetic-receipt-UI-fixture-only",
      cases: [1, 2, 3, 4].map(makeCase),
      inspection: {
        inspectionStatus: "FULL",
        page: { title: "Synthetic healthcare fixture" },
        publicDoctorCatalog: { available: true, approvedCount: 2, specialties: ["Cardiology"] },
        evidenceScope: "Synthetic browser fixture; no live upstream requests."
      }
    })
  }));
  await page.route("**/api/evaluate", route => route.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({
      success: true, evaluation: {
        storyId: "US-005", useCase: "UC-04", title: "Browse approved doctors",
        ai: { total: 4, linkedReadOnlyProbeCandidates: 1, exactNormalizedDuplicateTitles: 0 },
        manual: { total: 3, examples: [{ id: "TP-011", category: "Positive", priority: "P1",
          scenario: "Approved doctor listing" }] },
        categoryComparison: [{ type: "positive", generated: 1, manual: 1 }],
        interpretation: "Metadata only. NOT semantic coverage or automatic PASS."
      }
    })
  }));
  await page.route("**/api/review", route => route.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({
      success: true, reviewReceipt: "synthetic-signed-review-fixture",
      review: {
        summary: { approved: 1, rejected: 1, draft: 2 },
        cases: [], identityVerified: false
      }
    })
  }));
  await page.route("**/api/browser-plan-reviewed", route => route.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({
      success: true, storyId: "US-005", executed: false, approvedCaseIds: ["AI-001"],
      browserChecks: [{ storyId: "US-005", testId: "TC-0502",
        description: "Doctor search with synthetic fixtures" }],
      workflowUrl: "https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/workflows/reviewed-playwright.yml",
      interpretation: "A human selects a prewritten browser check; NOT a Gemini script execution."
    })
  }));
  await page.goto("/");
  await page.locator("#story-select").selectOption("US-005");
  await page.locator("#access-code").fill("synthetic-no-real-credentials");
  await page.locator("#generate-button").click();
  await expect(page.locator("#result-count")).toHaveText("4 candidates");
  await expect(page.locator("#evaluation-title")).toBeVisible();
  await page.locator("#evaluate-ai-button").click();
  await expect(page.locator("#evaluation-result")).toContainText("4 generated candidates vs 3 manually designed");
  await expect(page.locator("#evaluation-result")).toContainText("NOT semantic coverage");
  await expect(page.locator("#export-evaluation-button")).toBeVisible();
  await expect(page.locator(".lab-reviewer-summary")).toContainText("No acceptance criteria have been scored");
  await page.locator(".review-ai").first().selectOption("Covered");
  await page.locator(".review-manual").first().selectOption("Not covered");
  await expect(page.locator(".lab-reviewer-summary")).toContainText("AI: 1 covered / 1 reviewed");
  await expect(page.locator(".lab-reviewer-summary")).toContainText("Manual: 0 covered / 1 reviewed");
  await page.locator(".reviewer-notes").fill("Reviewer checked an isolated fixture only.");
  const downloadPending = page.waitForEvent("download");
  await page.locator("#export-evaluation-button").click();
  const downloaded = await downloadPending;
  const comparison = JSON.parse(await fs.readFile(await downloaded.path(), "utf8"));
  expect(comparison.reviewerAssessment.notAutomated).toBe(true);
  expect(comparison.reviewerAssessment.ai.covered).toBe(1);
  expect(comparison.reviewerAssessment.manual.notCovered).toBe(1);
  expect(comparison.reviewerAssessment.notes).toContain("isolated fixture");
  await expect(page.locator("#review-panel")).toBeVisible();
  await page.locator(".test-card").first().locator('[data-field="title"]')
    .fill("Reviewed source-grounded doctor catalog test");
  await page.locator(".ai-case-decision").first().selectOption("APPROVED");
  await page.locator(".ai-case-decision").nth(1).selectOption("REJECTED");
  await page.locator("#save-review-button").click();
  await expect(page.locator("#review-message")).toContainText("1 approved, 1 rejected");
  await expect(page.locator("#export-review-button")).toBeVisible();
  await page.locator("#browser-plan-button").click();
  await expect(page.locator("#browser-plan-result")).toContainText("TC-0502");
  await expect(page.locator("#browser-plan-result")).toContainText("No browser tests have started");
  await expect(page.locator("#browser-plan-result")).toContainText("NOT a Gemini script execution");
  await expect(page.locator("#prompt-log-count")).toContainText("1 actual model run(s)");
  await page.locator("#rating-completeness").selectOption("4");
  await page.locator("#rating-accuracy").selectOption("3");
  await page.locator("#rating-relevance").selectOption("5");
  await page.locator("#experiment-observation").fill("The model omitted the empty directory boundary.");
  await page.locator("#save-experiment-rating").click();
  await expect(page.locator("#prompt-log-count")).toContainText("1 with human quality ratings");
  const logPending = page.waitForEvent("download");
  await page.locator("#export-prompt-log").click();
  const promptDownload = await logPending;
  const prompt = JSON.parse(await fs.readFile(await promptDownload.path(), "utf8"));
  expect(prompt.recordedRuns).toBeGreaterThanOrEqual(1);
  expect(prompt.iterations.at(-1).humanRatings.accuracy).toBe(3);
  expect(prompt.iterations.at(-1).actualLlmOutput).toHaveLength(4);
  expect(prompt.iterations.at(-1)).not.toHaveProperty("receipt");
});


test("TC-0515 Lab exposes the 25-story traceability matrix without claiming execution", async ({ page }) => {
  await page.goto("/");
  await page.locator("#traceability-button").click();
  await expect(page.locator("#traceability-results tr")).toHaveCount(26);
  await expect(page.locator("#traceability-summary")).toContainText("Stories");
  await expect(page.locator("#traceability-summary")).toContainText("36");
  await expect(page.locator("#traceability-results")).toContainText("US-005");
  await expect(page.locator("#traceability-results")).toContainText("TC-0501");
  await expect(page.locator("#traceability-message")).toContainText("not PASS/FAIL");
  await page.setViewportSize({ width: 390, height: 844 });
  const overflow = await page.evaluate(
    () => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
  );
  expect(overflow).toBeLessThanOrEqual(1);
});


test("TC-0516 Lab displays actual-shaped failed CI screenshot without claiming model execution", async ({page})=>{
  const png="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==";
  await page.route("**/api/ci-results",route=>route.fulfill({
    status:200,contentType:"application/json",body:JSON.stringify({
      success:true,runs:[{
        runId:"12345678:1:playwright-chromium",timestamp:new Date().toISOString(),
        suite:"playwright-chromium",engine:"Static-CI",
        evidenceRunUrl:"https://github.com/Akash-annavarapu/doctor-appointment-booking-system/actions/runs/12345678",
        summary:{total:1,passed:0,failed:1,skipped:0,durationMs:32},
        testResults:[{id:"TC-0508",title:"Synthetic failure preview",
          status:"FAIL",executionTime:32,
          failureDetail:"Synthetic isolated assertion failed.",
          screenshotDataUrl:"data:image/png;base64,"+png}]
      }]
    })
  }));
  await page.goto("/");
  await page.locator("#load-ci-button").click();
  await expect(page.locator(".ci-failure-screenshot")).toBeVisible();
  await expect(page.locator(".ci-failure-screenshot")).toHaveAttribute("src",/data:image\/png;base64,/);
  await expect(page.locator("#ci-results")).toContainText("Synthetic isolated assertion failed.");
  await expect(page.locator("#ci-results a.lab-workflow-link"))
    .toHaveAttribute("href",/actions\/runs\/12345678/);
});

test("TC-0517 Lab records only consent-based measured peer observations",async ({page})=>{
  await page.route("**/api/peer-study",async route=>{
    const sent=route.request().postDataJSON();
    if(sent.action!=="session")return route.fulfill({status:400,
      contentType:"application/json",body:JSON.stringify({message:"Unexpected action"})});
    return route.fulfill({status:200,contentType:"application/json",
      body:JSON.stringify({success:true,record:{
        ...sent.session,recordedAt:new Date().toISOString(),
        identityVerified:false,source:"participant-entered-observation-not-automated-test"}})});
  });
  await page.goto("/");
  await page.locator("#access-code").fill("synthetic-fixture-only-code");
  await page.locator("#peer-participant").fill("Peer A");
  await page.locator("#peer-browser").fill("Desktop Chrome");
  await page.locator("#peer-feedback").fill("Participant needed clearer distinction between PASS and NOT_RUN.");
  await page.locator("#start-peer-timer").click();
  await page.locator("#save-peer-session").click();
  await expect(page.locator("#peer-session-status")).toContainText("Participant consent");
  await page.locator("#peer-consent").check();
  await page.locator("#save-peer-session").click();
  await expect(page.locator("#peer-session-status")).toContainText("1 genuine");
  const pending=page.waitForEvent("download");
  await page.locator("#export-peer-sessions").click();
  const download=await pending;
  const data=JSON.parse(await fs.readFile(await download.path(),"utf8"));
  expect(data.participants[0].identityVerified).toBe(false);
  expect(data.participants[0].consent).toBe(true);
});
