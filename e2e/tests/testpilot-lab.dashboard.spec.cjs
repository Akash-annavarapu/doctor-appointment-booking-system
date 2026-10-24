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
  await expect(page.getByText("Healthcare browser tests", { exact: true })).toBeVisible();
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
  await page.route("**/api/browser-plan", route => route.fulfill({
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
  await page.locator(".ai-case-approval").first().check();
  await page.locator("#browser-plan-button").click();
  await expect(page.locator("#browser-plan-result")).toContainText("TC-0502");
  await expect(page.locator("#browser-plan-result")).toContainText("No browser tests have started");
  await expect(page.locator("#browser-plan-result")).toContainText("NOT a Gemini script execution");
});
