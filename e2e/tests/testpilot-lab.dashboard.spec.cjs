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
  await expect(page.getByText("Playwright scenarios", { exact: true })).toBeVisible();
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
  await expect(page.getByText("All generated cases are NOT RUN")).toHaveCount(0);
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
