import { expect, test } from "@playwright/test";

test("a new user can register, manage links, update status, export and sign back in", async ({
  page,
}) => {
  const email = `browser-${Date.now()}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Alex Morgan");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("LocalTestPass123!");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your applications." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your next opportunity starts here" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Add application", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Company name").fill("Acme Technologies");
  await dialog.getByLabel("Role / job title").fill("Backend Engineer");
  await dialog
    .getByLabel("Application link", { exact: false })
    .first()
    .fill("https://careers.example.com/backend");
  await dialog
    .getByLabel("Application status link")
    .fill("https://careers.example.com/my-application");
  await dialog.getByLabel("Package / salary").fill("₹12–16 LPA");
  await dialog
    .getByRole("combobox", { name: "Application status", exact: true })
    .selectOption("APPLIED");
  await dialog.getByLabel("Applied on").fill("2026-10-27");
  await dialog
    .getByRole("button", { name: "Add application", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  const row = page.getByRole("row").filter({ hasText: "Acme Technologies" });
  await expect(
    row.getByRole("link", { name: "View application" }),
  ).toHaveAttribute("href", "https://careers.example.com/backend");
  await expect(row.getByRole("link", { name: "Check status" })).toHaveAttribute(
    "href",
    "https://careers.example.com/my-application",
  );
  await row
    .getByLabel("Status for Acme Technologies")
    .selectOption("INTERVIEW");
  await expect(page.getByRole("status")).toContainText("status updated");
  await page.reload();
  await expect(row.getByLabel("Status for Acme Technologies")).toHaveValue(
    "INTERVIEW",
  );
  await page.getByLabel("Search applications").fill("no such company");
  await expect(
    page.getByRole("heading", { name: "No matching applications" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(row).toBeVisible();
  await row
    .getByRole("button", { name: "Edit Acme Technologies", exact: true })
    .click();
  await dialog.getByLabel("Package / salary").fill("₹15–18 LPA");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(row).toContainText("₹15–18 LPA");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  expect((await downloadEvent).suggestedFilename()).toBe(
    "jobtrack-applications.csv",
  );
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("LocalTestPass123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Delete Acme Technologies" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Keep application" })
    .click();
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Delete Acme Technologies" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete application" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your next opportunity starts here" }),
  ).toBeVisible();
});

test("public site and sign-in stay usable on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.goto("/login");
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeDisabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("private workspace redirects unauthenticated visitors", async ({
  page,
}) => {
  await page.goto("/applications");
  await expect(page).toHaveURL(/\/login/);
  await expect(
    page.getByRole("heading", { name: "Good to see you again." }),
  ).toBeVisible();
});

test("the workspace and application editor work on a phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const result = await page.request.post("/api/auth/register", {
    headers: { Origin: "http://localhost:3000" },
    data: {
      name: "Mobile Tester",
      email: `mobile-${Date.now()}@example.com`,
      password: "LocalTestPass123!",
    },
  });
  expect(result.status()).toBe(201);
  await page.goto("/applications");
  await expect(
    page.getByRole("heading", { name: "Your applications." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Applications", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Add application", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "A new opportunity" }),
  ).toBeVisible();
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth + 1,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});
