const { test, expect } = require("../fixtures.cjs");

test("TC-0501 public homepage and synthetic doctor cards render", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", {
    name: /Good health starts with the right doctor/i
  })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Our Doctors" })).toBeVisible();
  await expect(page.locator(".doctor-directory-card")).toHaveCount(2);
  await testInfo.attach("homepage-synthetic-doctors", {
    body: await page.screenshot(),
    contentType: "image/png"
  });
});

test("TC-0502 directory filters by specialty and search text", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Showing 2 of 2 doctor profiles")).toBeVisible();
  await page.locator("#doctor-specialization").selectOption("Cardiology");
  await expect(page.getByText("Showing 1 of 2 doctor profiles")).toBeVisible();
  await expect(page.locator(".doctor-directory-card")).toHaveCount(1);
  await expect(page.locator(".doctor-directory-card")).toContainText("Cardiology");
  await page.locator("#doctor-search").fill("nothing-matches-this-fixture");
  await expect(page.getByText(/No matching doctors/)).toBeVisible();
  await expect(page.locator(".doctor-directory-card")).toHaveCount(0);
});

test("TC-0503 anonymous booking redirects to login without creating an appointment", async ({ page }) => {
  await page.goto("/");
  const card = page.locator(".doctor-directory-card").first();
  await expect(card).toContainText("Sign in to complete booking.");
  await card.getByRole("button", { name: "Book Appointment" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
});

test("TC-0504 read-only slot preview renders synthetic availability", async ({ page }) => {
  await page.goto("/");
  const card = page.locator(".doctor-directory-card").first();
  const day = new Date();
  day.setDate(day.getDate() + 3);
  const date = day.getFullYear() + "-" +
    String(day.getMonth() + 1).padStart(2, "0") + "-" +
    String(day.getDate()).padStart(2, "0");
  await card.locator('input[type="date"]').fill(date);
  await card.getByRole("button", { name: "Check slots" }).click();
  await expect(card.getByText(/2 open slots on/)).toBeVisible();
  await expect(card.locator(".doctor-directory-slot")).toHaveCount(2);
});

test("TC-0505 test-case catalog filters its 36 designed scenarios", async ({ page }) => {
  await page.goto("/test-cases");
  await expect(page.getByRole("heading", { name: "Explore test cases" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Showing 36 of 36 cases" })).toBeVisible();
  await page.locator("#testpilot-search").fill("TP-011");
  await expect(page.getByRole("heading", { name: "Showing 1 of 36 cases" })).toBeVisible();
  await expect(page.locator(".testpilot-case")).toHaveCount(1);
  await expect(page.locator(".testpilot-case")).toContainText("TP-011");
});

test("TC-0506 unauthenticated doctor route is protected", async ({ page }) => {
  await page.goto("/doctors");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
});

test("TC-0507 empty login form is blocked by browser validation", async ({ page }) => {
  await page.goto("/login");
  const email = page.locator('input[name="email"]');
  const password = page.locator('input[name="password"]');
  await expect(email).toHaveAttribute("required", "");
  await expect(password).toHaveAttribute("required", "");
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
});


test("TC-0512 redesigned blue healthcare homepage keeps doctor search and training transparency", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Find your doctor/ }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /Your next appointment/ })).toBeVisible();
  await expect(page.locator(".doctor-card-media")).toHaveCount(2);
  await expect(page.getByText(/These fictional doctor profiles/i)).toBeVisible();
  const ctaColor = await page.locator(".app-book-visit").evaluate(
    (element) => getComputedStyle(element).backgroundColor
  );
  expect(ctaColor).toBe("rgb(24, 98, 214)");
});

test("TC-0513 mobile healthcare page avoids horizontal scroll and offers accessible menu", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Toggle navigation" });
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("link", { name: "Test Cases" })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
