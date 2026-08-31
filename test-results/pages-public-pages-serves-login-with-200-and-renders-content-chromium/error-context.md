# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pages.spec.ts >> public pages >> serves /login with 200 and renders content
- Location: e2e\pages.spec.ts:16:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /Sign In|Log In/i }).first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: /Sign In|Log In/i }).first()

```

```yaml
- banner:
  - link "BuildCost GH":
    - /url: /
  - navigation:
    - link "Home":
      - /url: /
    - link "Calculator":
      - /url: /calculator
    - link "Costs by Region":
      - /url: /costs
    - link "Building Types":
      - /url: /building-types/residential
    - link "Pricing":
      - /url: /pricing
    - link "Services":
      - /url: /services
  - button "EN"
  - link "+233 53 936 4716":
    - /url: tel:+233539364716
  - link "Sign In":
    - /url: /login
  - link "Start Calculating":
    - /url: /calculator
    - button "Start Calculating"
- main:
  - heading "Welcome Back" [level=1]
  - paragraph: Sign in to access your estimates, orders, and subscription.
  - text: Email
  - textbox "Email":
    - /placeholder: your@email.com
  - text: Password
  - textbox "Password":
    - /placeholder: Enter your password
  - button "Show password"
  - link "Forgot password?":
    - /url: /forgot-password
  - button "Sign In"
  - paragraph:
    - text: Don't have an account?
    - link "Sign up free":
      - /url: /signup
- contentinfo:
  - text: BuildCost GH
  - paragraph: The leading construction cost estimation platform for Ghanaians and the global African diaspora. Plan your dream home or real estate investment with accurate, real-time cost data.
  - link "info@buildcostgh.com":
    - /url: mailto:info%40buildcostgh.com
  - link "+233 53 936 4716":
    - /url: tel:+233539364716
  - paragraph: Lashibi, Tema, Ghana
  - link "Facebook":
    - /url: https://web.facebook.com/people/BuildCost-GH/61574509482284/
    - img
  - link "X (Twitter)":
    - /url: https://x.com/BuildCostGH
    - img
  - link "Instagram":
    - /url: https://www.instagram.com/buildcostgh/
    - img
  - link "LinkedIn":
    - /url: https://www.linkedin.com/company/buildcost-gh
    - img
  - link "YouTube":
    - /url: https://www.youtube.com/@BuildCostGH
    - img
  - link "TikTok":
    - /url: https://www.tiktok.com/@buildcostgh
    - img
  - heading "Company" [level=3]
  - list:
    - listitem:
      - link "About Us":
        - /url: /about
    - listitem:
      - link "Authors":
        - /url: /authors
    - listitem:
      - link "Careers":
        - /url: /careers
    - listitem:
      - link "CSR & Flood Relief":
        - /url: /csr
    - listitem:
      - link "Investors":
        - /url: /investors
    - listitem:
      - link "Affiliates":
        - /url: /affiliates
    - listitem:
      - link "Press Kit":
        - /url: /press-kit
  - heading "Quick Links" [level=3]
  - list:
    - listitem:
      - link "Home":
        - /url: /
    - listitem:
      - link "Calculator":
        - /url: /calculator
    - listitem:
      - link "Regional Cost Database":
        - /url: /costs
    - listitem:
      - link "Building Types":
        - /url: /building-types/residential
    - listitem:
      - link "Pricing":
        - /url: /pricing
    - listitem:
      - link "Contractors":
        - /url: /contractors
    - listitem:
      - link "Flood Safe Land":
        - /url: /flood-safe-land
    - listitem:
      - link "Blog":
        - /url: /blog
    - listitem:
      - link "About":
        - /url: /about
    - listitem:
      - link "Contact":
        - /url: /contact
  - heading "Services" [level=3]
  - list:
    - listitem:
      - link "Cost Estimation":
        - /url: /services/cost-estimation
    - listitem:
      - link "PDF Reports":
        - /url: /services/pdf-reports
    - listitem:
      - link "Excel Spreadsheets":
        - /url: /services/excel-spreadsheets
    - listitem:
      - link "Contractor Contacts":
        - /url: /services/contractor-contacts
    - listitem:
      - link "Consultation":
        - /url: /services/consultation
    - listitem:
      - link "Project Monitoring":
        - /url: /services/project-monitoring
  - heading "Developers" [level=3]
  - list:
    - listitem:
      - link "API Docs":
        - /url: /api-docs
    - listitem:
      - link "API Pricing":
        - /url: /api-pricing
    - listitem:
      - link "Quick Start":
        - /url: /api-docs
  - heading "Newsletter" [level=3]
  - paragraph: Get construction tips and cost updates.
  - textbox "Your email"
  - button "Subscribe"
  - paragraph: © 2026 BuildCost GH. All rights reserved.
  - paragraph:
    - text: A product of
    - link "Gabochie Design":
      - /url: https://gabochie.com
  - link "Privacy Policy":
    - /url: /privacy
  - link "Terms of Service":
    - /url: /terms
  - link "Cookie Policy":
    - /url: /cookies
  - link "Refund Policy":
    - /url: /refund
  - link "Disclaimer":
    - /url: /disclaimer
- paragraph:
  - text: We use cookies to improve your experience, analyze traffic, and process payments. By continuing, you agree to our
  - link "Cookie Policy":
    - /url: /cookies
  - text: .
- button "Decline"
- button "Accept All"
- link "Chat on WhatsApp":
  - /url: https://wa.me/233539364716?text=Hi%20BuildCost%20GH!%20I%20have%20a%20question%20about%20construction%20costs.
  - img
- button "Open chat"
- region "Notifications alt+T"
- alert
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
  9  |   { path: "/order-success", heading: /Order|Payment|Success/i },
  10 |   { path: "/login", heading: /Sign In|Log In/i },
  11 |   { path: "/costs", heading: /Cost|Region/i },
  12 | ]
  13 | 
  14 | test.describe("public pages", () => {
  15 |   for (const { path, heading } of PUBLIC_PAGES) {
  16 |     test(`serves ${path} with 200 and renders content`, async ({ page, request }) => {
  17 |       const res = await request.get(path)
  18 |       expect(res.status()).toBe(200)
  19 | 
  20 |       const pageErrors: string[] = []
  21 |       page.on("pageerror", (err) => pageErrors.push(err.message))
  22 | 
  23 |       await page.goto(path)
  24 |       // Landing content is present (the page did not render a fatal error/blank).
  25 |       await expect(page.locator("body")).not.toBeEmpty()
  26 |       // A heading matching the expected content is visible.
> 27 |       await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible()
     |                                                                          ^ Error: expect(locator).toBeVisible() failed
  28 | 
  29 |       expect(pageErrors).toEqual([])
  30 |     })
  31 |   }
  32 | })
  33 | 
```