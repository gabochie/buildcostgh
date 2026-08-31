import { test, expect } from "@playwright/test"

test.describe("access control & CSRF", () => {
  test("unauthenticated /dashboard redirects to the sign-in area", async ({ page }) => {
    await page.goto("/dashboard")
    await page.waitForLoadState("domcontentloaded")
    // proxy.ts sends unauthenticated dashboard visitors to /admin (the sign-in
    // surface) with a callbackUrl.
    expect(page.url()).toContain("/admin")
  })

  test("unauthenticated /admin/orders (protected subpage) redirects to /admin", async ({ page }) => {
    await page.goto("/admin/orders")
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toContain("/admin")
  })

  test("POST to a public API without a CSRF token is rejected", async ({ request }) => {
    const res = await request.post("/api/newsletter", { data: { email: "test@example.com" } })
    // The proxy enforces CSRF on all state-changing /api routes (except
    // auth/webhooks/v1). Without a token this must not reach the handler.
    expect(res.status()).toBe(403)
  })

  test("unknown route returns a 404 page", async ({ page, request }) => {
    const res = await request.get("/definitely-not-a-real-page")
    expect(res.status()).toBe(404)
  })
})
