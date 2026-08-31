# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pages.spec.ts >> public pages >> serves /costs with 200 and renders content
- Location: e2e\pages.spec.ts:15:9

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 500
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test"
  2  | 
  3  | const PUBLIC_PAGES: { path: string; heading: RegExp }[] = [
  4  |   { path: "/", heading: /BuildCost|Building Cost|Estimate/i },
  5  |   { path: "/calculator", heading: /Building Type|Calculator/i },
  6  |   { path: "/pricing", heading: /Pricing|Plans/i },
  7  |   { path: "/how-it-works", heading: /How It Works|Steps/i },
  8  |   { path: "/services", heading: /Services/i },
  9  |   { path: "/login", heading: /Welcome Back|Sign In/i },
  10 |   { path: "/costs", heading: /Cost|Region/i },
  11 | ]
  12 | 
  13 | test.describe("public pages", () => {
  14 |   for (const { path, heading } of PUBLIC_PAGES) {
  15 |     test(`serves ${path} with 200 and renders content`, async ({ page, request }) => {
  16 |       const res = await request.get(path)
> 17 |       expect(res.status()).toBe(200)
     |                            ^ Error: expect(received).toBe(expected) // Object.is equality
  18 | 
  19 |       await page.goto(path)
  20 |       // Landing content is present (the page did not render a fatal error/blank).
  21 |       await expect(page.locator("body")).not.toBeEmpty()
  22 |       // A heading matching the expected content is visible.
  23 |       await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible()
  24 |     })
  25 |   }
  26 | 
  27 |   test("order-success shell serves 200 without requiring a DB reference", async ({ page, request }) => {
  28 |     // Without a ?reference the page shows its verification spinner (no DB hit),
  29 |     // so we only assert the shell loads and is not a raw error page.
  30 |     const res = await request.get("/order-success")
  31 |     expect(res.status()).toBe(200)
  32 |     await page.goto("/order-success")
  33 |     await expect(page.locator("body")).not.toBeEmpty()
  34 |   })
  35 | })
  36 | 
```