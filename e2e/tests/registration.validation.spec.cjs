const { test, expect } = require("../fixtures.cjs");

// These browser checks use synthetic input and the shared fixture that blocks
// every healthcare API write. They verify client-side behavior only.
test("TC-0508 registration rejects missing required fields without submitting", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Register" })).toBeVisible();
  for (const name of ["name", "email", "phone", "password"]) {
    await expect(page.locator('input[name="' + name + '"]')).toHaveAttribute("required", "");
  }
  await page.getByRole("button", { name: "Register", exact: true }).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.locator('input[name="name"]')).toBeFocused();
});

test("TC-0509 seven-character registration password is blocked by browser validation", async ({ page }) => {
  await page.goto("/register");
  await page.locator('input[name="name"]').fill("Synthetic Student");
  await page.locator('input[name="email"]').fill("synthetic@example.invalid");
  await page.locator('input[name="phone"]').fill("9876543210");
  const password = page.locator('input[name="password"]');
  await password.fill("Test123");
  await expect(password).toHaveAttribute("minlength", "8");
  await page.getByRole("button", { name: "Register", exact: true }).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(password).toBeFocused();
});

test("TC-0510 invalid email prevents login submission", async ({ page }) => {
  await page.goto("/login");
  const email = page.locator('input[name="email"]');
  await email.fill("not-an-email");
  await page.locator('input[name="password"]').fill("synthetic-password");
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(email).toBeFocused();
});
