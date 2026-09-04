import { test, expect } from "@playwright/test"

const PUBLIC_PAGES: { path: string; heading: RegExp }[] = [
  { path: "/", heading: /BuildCost|Building Cost|Estimate/i },
  { path: "/calculator", heading: /Building Type|Calculator/i },
  { path: "/pricing", heading: /Pricing|Plans/i },
  { path: "/how-it-works", heading: /How It Works|Steps/i },
  { path: "/services", heading: /Services/i },
  { path: "/login", heading: /Welcome Back|Sign In/i },
]

test.describe("public pages", () => {
  for (const { path, heading } of PUBLIC_PAGES) {
    test(`serves ${path} with 200 and renders content`, async ({ page, request }) => {
      const res = await request.get(path)
      expect(res.status()).toBe(200)

      await page.goto(path)
      // Landing content is present (the page did not render a fatal error/blank).
      await expect(page.locator("body")).not.toBeEmpty()
      // A heading matching the expected content is visible.
      await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible()
    })
  }

  test("order-success shell serves 200 without requiring a DB reference", async ({ page, request }) => {
    // Without a ?reference the page shows its verification spinner (no DB hit),
    // so we only assert the shell loads and is not a raw error page.
    const res = await request.get("/order-success")
    expect(res.status()).toBe(200)
    await page.goto("/order-success")
    await expect(page.locator("body")).not.toBeEmpty()
  })
})
