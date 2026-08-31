# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: navigation.spec.ts >> site navigation >> clicking Pricing nav link navigates to /pricing
- Location: e2e\navigation.spec.ts:45:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/pricing/
Received string:  "http://localhost:3210/"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    13 × locator resolved to <html lang="en" class="__variable_f367f3 __variable_0a80b4 __variable_c29908 h-full antialiased">…</html>
       - unexpected value "http://localhost:3210/"

```

```yaml
- banner:
  - link "BuildCostGh":
    - /url: /
    - img "BuildCostGh"
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
  - text: Trusted by 1,000+ builders and homeowners across Ghana
  - heading "Know Your Building Cost Before You Start" [level=1]
  - paragraph: Ghana's most trusted construction cost calculator. Instant estimates for all 16 regions, 13 building types, and any quality level.
  - link "Get Your Estimate":
    - /url: /calculator
    - button "Get Your Estimate"
  - link "Watch Demo":
    - /url: https://www.youtube.com/watch?v=ezZ3hkpo71g
  - text: MTN MoMo Secure SSL Encrypted Ghana Data
  - img "BuildCostGh — construction professionals using the platform on site"
  - text: 0+ Calculations 0% Accuracy Rate 0+ Contractor Partners 0/7 Support
  - heading "What Our Users Say" [level=2]
  - paragraph: Join thousands of Ghanaians and diaspora Africans who planned their dream homes and investments with confidence.
  - paragraph: “BuildCost GH saved me weeks of research. The estimate was within 5% of what my contractor quoted. Worth every pesewa!”
  - text: KA
  - paragraph: Kwame Asante
  - paragraph: Homeowner, Accra
  - paragraph: “I recommend BuildCost GH to all my clients. The detailed breakdown helps them budget realistically before we even start design.”
  - text: AO
  - paragraph: Abena Osei
  - paragraph: Architect, Kumasi
  - paragraph: “We use BuildCost GH for all our feasibility studies. The region comparison feature is a game-changer for site selection.”
  - text: YM
  - paragraph: Yaw Mensah
  - paragraph: Real Estate Developer, Tema
  - paragraph: “Being in the UK, I had no idea what building actually costs in Ghana. BuildCost GH gave me accurate estimates and connected me with vetted contractors. A game-changer for diaspora investors.”
  - text: AK
  - paragraph: Ama K.
  - paragraph: Diaspora Investor, London — Building in Accra
  - heading "How It Works" [level=2]
  - paragraph: Four simple steps to get your construction cost estimate.
  - text: "01"
  - heading "Enter Your Details" [level=3]
  - paragraph: Tell us about your project — bedrooms, location, size, and preferences.
  - text: "02"
  - heading "Get Instant Estimate" [level=3]
  - paragraph: Our engine processes real Ghana market data to give you an accurate cost.
  - text: "03"
  - heading "Compare Options" [level=3]
  - paragraph: See how costs vary by region, finishing grade, and additional features.
  - text: "04"
  - heading "Get Your Report" [level=3]
  - paragraph: Download a detailed PDF with itemised costs, timelines, and contractor insights.
  - heading "Get Your Free Construction Cost Guide" [level=2]
  - paragraph: Download our comprehensive guide — built for Ghanaians and the global diaspora. Learn how to budget, save money, and avoid common pitfalls.
  - textbox "Enter your email"
  - button "Download Free Guide"
  - paragraph: Free PDF · No spam · Unsubscribe anytime
  - heading "Ready to Build?" [level=2]
  - paragraph: Get your construction cost estimate in minutes and start planning your dream home today.
  - link "Start Your Free Estimate":
    - /url: /calculator
    - button "Start Your Free Estimate"
  - heading "Frequently Asked Questions" [level=2]
  - paragraph: Direct answers to the questions people ask most about building in Ghana.
  - heading "How much does it cost to build a house in Ghana?" [level=3]:
    - button "How much does it cost to build a house in Ghana?"
  - heading "How does the BuildCost GH calculator work?" [level=3]:
    - button "How does the BuildCost GH calculator work?"
  - heading "Is BuildCost GH free to use?" [level=3]:
    - button "Is BuildCost GH free to use?"
  - heading "Is BuildCost GH suitable for the diaspora building in Ghana?" [level=3]:
    - button "Is BuildCost GH suitable for the diaspora building in Ghana?"
  - heading "How accurate are the estimates?" [level=3]:
    - button "How accurate are the estimates?"
  - heading "What types of buildings can I estimate?" [level=3]:
    - button "What types of buildings can I estimate?"
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
  3  | const navLinks = [
  4  |   { href: "/", label: "Home" },
  5  |   { href: "/calculator", label: "Calculator" },
  6  |   { href: "/costs", label: "Costs by Region" },
  7  |   { href: "/building-types/residential", label: "Building Types" },
  8  |   { href: "/pricing", label: "Pricing" },
  9  |   { href: "/services", label: "Services" },
  10 | ]
  11 | 
  12 | test.describe("site navigation", () => {
  13 |   test("homepage renders and header nav links are present", async ({ page }) => {
  14 |     const errors: string[] = []
  15 |     page.on("console", (msg) => {
  16 |       if (msg.type() === "error") errors.push(msg.text())
  17 |     })
  18 |     page.on("pageerror", (err) => errors.push(err.message))
  19 | 
  20 |     await page.goto("/")
  21 |     await expect(page).toHaveTitle(/BuildCost/i)
  22 | 
  23 |     // Brand + primary CTA in the header
  24 |     await expect(page.getByRole("link", { name: /BuildCost GH/i }).first()).toBeVisible()
  25 | 
  26 |     // Primary nav links resolve to the right hrefs
  27 |     for (const link of navLinks) {
  28 |       const el = page.getByRole("link", { name: link.label }).first()
  29 |       await expect(el).toBeVisible()
  30 |       await expect(el).toHaveAttribute("href", link.href)
  31 |     }
  32 | 
  33 |     // Header CTA wired to the calculator
  34 |     await expect(page.getByRole("link", { name: /Start Calculating/i }).first()).toBeVisible()
  35 | 
  36 |     expect(errors).toEqual([])
  37 |   })
  38 | 
  39 |   test("clicking the Calculator nav link navigates to /calculator", async ({ page }) => {
  40 |     await page.goto("/")
  41 |     await page.getByRole("link", { name: "Calculator" }).first().click()
  42 |     await expect(page).toHaveURL(/\/calculator/)
  43 |   })
  44 | 
  45 |   test("clicking Pricing nav link navigates to /pricing", async ({ page }) => {
  46 |     await page.goto("/")
  47 |     await page.getByRole("link", { name: "Pricing" }).first().click()
> 48 |     await expect(page).toHaveURL(/\/pricing/)
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  49 |   })
  50 | 
  51 |   test("footer renders key informational links", async ({ page }) => {
  52 |     await page.goto("/")
  53 |     // A footer is present if there is at least one standard informational link
  54 |     const footerLink = page.locator("footer a").first()
  55 |     await expect(footerLink).toBeVisible()
  56 |   })
  57 | })
  58 | 
```