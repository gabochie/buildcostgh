# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pages.spec.ts >> public pages >> serves / with 200 and renders content
- Location: e2e\pages.spec.ts:15:9

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 3

- Array []
+ Array [
+   "Invalid or unexpected token",
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "BuildCost GH" [ref=e4] [cursor=pointer]:
        - /url: /
      - navigation [ref=e11]:
        - link "Home" [ref=e12] [cursor=pointer]:
          - /url: /
        - link "Calculator" [ref=e13] [cursor=pointer]:
          - /url: /calculator
        - link "Costs by Region" [ref=e14] [cursor=pointer]:
          - /url: /costs
        - link "Building Types" [ref=e15] [cursor=pointer]:
          - /url: /building-types/residential
        - link "Pricing" [ref=e16] [cursor=pointer]:
          - /url: /pricing
        - link "Services" [ref=e17] [cursor=pointer]:
          - /url: /services
      - generic [ref=e18]:
        - button "EN" [ref=e20]
        - link "+233 53 936 4716" [ref=e25] [cursor=pointer]:
          - /url: tel:+233539364716
        - link "Sign In" [ref=e29] [cursor=pointer]:
          - /url: /login
        - link [ref=e30] [cursor=pointer]:
          - /url: /calculator
          - button "Start Calculating" [ref=e31]
  - main [ref=e32]:
    - generic [ref=e38]:
      - generic [ref=e39]:
        - generic [ref=e40]: Trusted by 1,000+ builders and homeowners across Ghana
        - heading "Know Your Building Cost Before You Start" [level=1] [ref=e43]
        - paragraph [ref=e44]: Ghana's most trusted construction cost calculator. Instant estimates for all 16 regions, 13 building types, and any quality level.
        - generic [ref=e45]:
          - link [ref=e46] [cursor=pointer]:
            - /url: /calculator
            - button "Get Your Estimate" [ref=e47]
          - link "Watch Demo" [ref=e51] [cursor=pointer]:
            - /url: https://www.youtube.com/watch?v=ezZ3hkpo71g
        - generic [ref=e54]:
          - generic [ref=e55]: MTN MoMo Secure
          - generic [ref=e59]: SSL Encrypted
          - generic [ref=e62]: Ghana Data
      - generic [ref=e67]:
        - generic [ref=e68]: Sample Cost Estimate
        - generic [ref=e69]: GHS 250,000
        - generic [ref=e70]: 3 Bedroom · Accra · 200 m² · Grade B
        - generic [ref=e71]:
          - generic [ref=e73]:
            - generic [ref=e74]: Foundation
            - generic [ref=e75]: GHS 45,000
          - generic [ref=e79]:
            - generic [ref=e80]: Structure
            - generic [ref=e81]: GHS 85,000
          - generic [ref=e85]:
            - generic [ref=e86]: Finishing
            - generic [ref=e87]: GHS 95,000
          - generic [ref=e91]:
            - generic [ref=e92]: Services
            - generic [ref=e93]: GHS 25,000
        - link "Get your personalized estimate" [ref=e97] [cursor=pointer]:
          - /url: /calculator
    - generic [ref=e102]:
      - generic [ref=e103]:
        - generic [ref=e104]: 0+
        - generic [ref=e106]: Calculations
      - generic [ref=e107]:
        - generic [ref=e108]: 0%
        - generic [ref=e110]: Accuracy Rate
      - generic [ref=e111]:
        - generic [ref=e112]: 0+
        - generic [ref=e114]: Contractor Partners
      - generic [ref=e115]:
        - generic [ref=e116]: 0/7
        - generic [ref=e118]: Support
    - generic [ref=e120]:
      - generic [ref=e121]:
        - heading "What Our Users Say" [level=2] [ref=e122]
        - paragraph [ref=e123]: Join thousands of Ghanaians and diaspora Africans who planned their dream homes and investments with confidence.
      - generic [ref=e124]:
        - generic [ref=e126]:
          - paragraph [ref=e138]: “BuildCost GH saved me weeks of research. The estimate was within 5% of what my contractor quoted. Worth every pesewa!”
          - generic [ref=e139]:
            - generic [ref=e140]: KA
            - generic [ref=e141]:
              - paragraph [ref=e142]: Kwame Asante
              - paragraph [ref=e143]: Homeowner, Accra
        - generic [ref=e145]:
          - paragraph [ref=e157]: “I recommend BuildCost GH to all my clients. The detailed breakdown helps them budget realistically before we even start design.”
          - generic [ref=e158]:
            - generic [ref=e159]: AO
            - generic [ref=e160]:
              - paragraph [ref=e161]: Abena Osei
              - paragraph [ref=e162]: Architect, Kumasi
        - generic [ref=e164]:
          - paragraph [ref=e176]: “We use BuildCost GH for all our feasibility studies. The region comparison feature is a game-changer for site selection.”
          - generic [ref=e177]:
            - generic [ref=e178]: YM
            - generic [ref=e179]:
              - paragraph [ref=e180]: Yaw Mensah
              - paragraph [ref=e181]: Real Estate Developer, Tema
        - generic [ref=e183]:
          - paragraph [ref=e195]: “Being in the UK, I had no idea what building actually costs in Ghana. BuildCost GH gave me accurate estimates and connected me with vetted contractors. A game-changer for diaspora investors.”
          - generic [ref=e196]:
            - generic [ref=e197]: AK
            - generic [ref=e198]:
              - paragraph [ref=e199]: Ama K.
              - paragraph [ref=e200]: Diaspora Investor, London — Building in Accra
    - generic [ref=e202]:
      - generic [ref=e203]:
        - heading "How It Works" [level=2] [ref=e204]
        - paragraph [ref=e205]: Four simple steps to get your construction cost estimate.
      - generic [ref=e206]:
        - generic [ref=e207]:
          - generic [ref=e208]: "01"
          - heading "Enter Your Details" [level=3] [ref=e210]
          - paragraph [ref=e211]: Tell us about your project — bedrooms, location, size, and preferences.
        - generic [ref=e212]:
          - generic [ref=e213]: "02"
          - heading "Get Instant Estimate" [level=3] [ref=e215]
          - paragraph [ref=e216]: Our engine processes real Ghana market data to give you an accurate cost.
        - generic [ref=e217]:
          - generic [ref=e218]: "03"
          - heading "Compare Options" [level=3] [ref=e220]
          - paragraph [ref=e221]: See how costs vary by region, finishing grade, and additional features.
        - generic [ref=e222]:
          - generic [ref=e223]: "04"
          - heading "Get Your Report" [level=3] [ref=e224]
          - paragraph [ref=e225]: Download a detailed PDF with itemised costs, timelines, and contractor insights.
    - generic [ref=e227]:
      - heading "Get Your Free Construction Cost Guide" [level=2] [ref=e228]
      - paragraph [ref=e229]: Download our comprehensive guide — built for Ghanaians and the global diaspora. Learn how to budget, save money, and avoid common pitfalls.
      - generic [ref=e230]:
        - textbox "Enter your email" [ref=e231]
        - button "Download Free Guide" [ref=e232]
      - paragraph [ref=e234]: Free PDF · No spam · Unsubscribe anytime
    - generic [ref=e236]:
      - heading "Ready to Build?" [level=2] [ref=e237]
      - paragraph [ref=e238]: Get your construction cost estimate in minutes and start planning your dream home today.
      - link [ref=e239] [cursor=pointer]:
        - /url: /calculator
        - button "Start Your Free Estimate" [ref=e240]
    - generic [ref=e245]:
      - generic [ref=e246]:
        - heading "Frequently Asked Questions" [level=2] [ref=e247]
        - paragraph [ref=e248]: Direct answers to the questions people ask most about building in Ghana.
      - generic [ref=e249]:
        - heading [level=3] [ref=e251]:
          - button "How much does it cost to build a house in Ghana?" [ref=e252]
        - heading [level=3] [ref=e254]:
          - button "How does the BuildCost GH calculator work?" [ref=e255]
        - heading [level=3] [ref=e257]:
          - button "Is BuildCost GH free to use?" [ref=e258]
        - heading [level=3] [ref=e260]:
          - button "Is BuildCost GH suitable for the diaspora building in Ghana?" [ref=e261]
        - heading [level=3] [ref=e263]:
          - button "How accurate are the estimates?" [ref=e264]
        - heading [level=3] [ref=e266]:
          - button "What types of buildings can I estimate?" [ref=e267]
  - contentinfo [ref=e268]:
    - generic [ref=e269]:
      - generic [ref=e270]:
        - generic [ref=e271]:
          - generic [ref=e272]: BuildCost GH
          - paragraph [ref=e277]: The leading construction cost estimation platform for Ghanaians and the global African diaspora. Plan your dream home or real estate investment with accurate, real-time cost data.
          - generic [ref=e278]:
            - link "info@buildcostgh.com" [ref=e279] [cursor=pointer]:
              - /url: mailto:info%40buildcostgh.com
            - link "+233 53 936 4716" [ref=e284] [cursor=pointer]:
              - /url: tel:+233539364716
            - paragraph [ref=e287]: Lashibi, Tema, Ghana
          - generic [ref=e291]:
            - link "Facebook" [ref=e292] [cursor=pointer]:
              - /url: https://web.facebook.com/people/BuildCost-GH/61574509482284/
            - link "X (Twitter)" [ref=e295] [cursor=pointer]:
              - /url: https://x.com/BuildCostGH
            - link "Instagram" [ref=e298] [cursor=pointer]:
              - /url: https://www.instagram.com/buildcostgh/
            - link "LinkedIn" [ref=e301] [cursor=pointer]:
              - /url: https://www.linkedin.com/company/buildcost-gh
            - link "YouTube" [ref=e304] [cursor=pointer]:
              - /url: https://www.youtube.com/@BuildCostGH
            - link "TikTok" [ref=e307] [cursor=pointer]:
              - /url: https://www.tiktok.com/@buildcostgh
        - generic [ref=e310]:
          - heading "Company" [level=3] [ref=e311]
          - list [ref=e312]:
            - listitem [ref=e313]:
              - link "About Us" [ref=e314] [cursor=pointer]:
                - /url: /about
            - listitem [ref=e315]:
              - link "Authors" [ref=e316] [cursor=pointer]:
                - /url: /authors
            - listitem [ref=e317]:
              - link "Careers" [ref=e318] [cursor=pointer]:
                - /url: /careers
            - listitem [ref=e319]:
              - link "CSR & Flood Relief" [ref=e320] [cursor=pointer]:
                - /url: /csr
            - listitem [ref=e321]:
              - link "Investors" [ref=e322] [cursor=pointer]:
                - /url: /investors
            - listitem [ref=e323]:
              - link "Affiliates" [ref=e324] [cursor=pointer]:
                - /url: /affiliates
            - listitem [ref=e325]:
              - link "Press Kit" [ref=e326] [cursor=pointer]:
                - /url: /press-kit
        - generic [ref=e327]:
          - heading "Quick Links" [level=3] [ref=e328]
          - list [ref=e329]:
            - listitem [ref=e330]:
              - link "Home" [ref=e331] [cursor=pointer]:
                - /url: /
            - listitem [ref=e332]:
              - link "Calculator" [ref=e333] [cursor=pointer]:
                - /url: /calculator
            - listitem [ref=e334]:
              - link "Regional Cost Database" [ref=e335] [cursor=pointer]:
                - /url: /costs
            - listitem [ref=e336]:
              - link "Building Types" [ref=e337] [cursor=pointer]:
                - /url: /building-types/residential
            - listitem [ref=e338]:
              - link "Pricing" [ref=e339] [cursor=pointer]:
                - /url: /pricing
            - listitem [ref=e340]:
              - link "Contractors" [ref=e341] [cursor=pointer]:
                - /url: /contractors
            - listitem [ref=e342]:
              - link "Flood Safe Land" [ref=e343] [cursor=pointer]:
                - /url: /flood-safe-land
            - listitem [ref=e344]:
              - link "Blog" [ref=e345] [cursor=pointer]:
                - /url: /blog
            - listitem [ref=e346]:
              - link "About" [ref=e347] [cursor=pointer]:
                - /url: /about
            - listitem [ref=e348]:
              - link "Contact" [ref=e349] [cursor=pointer]:
                - /url: /contact
        - generic [ref=e350]:
          - heading "Services" [level=3] [ref=e351]
          - list [ref=e352]:
            - listitem [ref=e353]:
              - link "Cost Estimation" [ref=e354] [cursor=pointer]:
                - /url: /services/cost-estimation
            - listitem [ref=e355]:
              - link "PDF Reports" [ref=e356] [cursor=pointer]:
                - /url: /services/pdf-reports
            - listitem [ref=e357]:
              - link "Excel Spreadsheets" [ref=e358] [cursor=pointer]:
                - /url: /services/excel-spreadsheets
            - listitem [ref=e359]:
              - link "Contractor Contacts" [ref=e360] [cursor=pointer]:
                - /url: /services/contractor-contacts
            - listitem [ref=e361]:
              - link "Consultation" [ref=e362] [cursor=pointer]:
                - /url: /services/consultation
            - listitem [ref=e363]:
              - link "Project Monitoring" [ref=e364] [cursor=pointer]:
                - /url: /services/project-monitoring
        - generic [ref=e365]:
          - heading "Developers" [level=3] [ref=e366]
          - list [ref=e367]:
            - listitem [ref=e368]:
              - link "API Docs" [ref=e369] [cursor=pointer]:
                - /url: /api-docs
            - listitem [ref=e370]:
              - link "API Pricing" [ref=e371] [cursor=pointer]:
                - /url: /api-pricing
            - listitem [ref=e372]:
              - link "Quick Start" [ref=e373] [cursor=pointer]:
                - /url: /api-docs
        - generic [ref=e374]:
          - heading "Newsletter" [level=3] [ref=e375]
          - paragraph [ref=e376]: Get construction tips and cost updates.
          - generic [ref=e378]:
            - textbox "Your email" [ref=e379]
            - button "Subscribe" [ref=e380]
      - generic [ref=e381]:
        - paragraph [ref=e382]: © 2026 BuildCost GH. All rights reserved.
        - paragraph [ref=e383]:
          - text: A product of
          - link "Gabochie Design" [ref=e384] [cursor=pointer]:
            - /url: https://gabochie.com
        - generic [ref=e385]:
          - link "Privacy Policy" [ref=e386] [cursor=pointer]:
            - /url: /privacy
          - link "Terms of Service" [ref=e387] [cursor=pointer]:
            - /url: /terms
          - link "Cookie Policy" [ref=e388] [cursor=pointer]:
            - /url: /cookies
          - link "Refund Policy" [ref=e389] [cursor=pointer]:
            - /url: /refund
          - link "Disclaimer" [ref=e390] [cursor=pointer]:
            - /url: /disclaimer
  - link "Chat on WhatsApp" [ref=e391] [cursor=pointer]:
    - /url: https://wa.me/233539364716?text=Hi%20BuildCost%20GH!%20I%20have%20a%20question%20about%20construction%20costs.
  - button "Open chat" [ref=e394]
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e402] [cursor=pointer]
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
  17 |       expect(res.status()).toBe(200)
  18 | 
  19 |       const pageErrors: string[] = []
  20 |       page.on("pageerror", (err) => pageErrors.push(err.message))
  21 | 
  22 |       await page.goto(path)
  23 |       // Landing content is present (the page did not render a fatal error/blank).
  24 |       await expect(page.locator("body")).not.toBeEmpty()
  25 |       // A heading matching the expected content is visible.
  26 |       await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible()
  27 | 
> 28 |       expect(pageErrors).toEqual([])
     |                          ^ Error: expect(received).toEqual(expected) // deep equality
  29 |     })
  30 |   }
  31 | 
  32 |   test("order-success shell serves 200 without requiring a DB reference", async ({ page, request }) => {
  33 |     // Without a ?reference the page shows its verification spinner (no DB hit),
  34 |     // so we only assert the shell loads and is not a raw error page.
  35 |     const res = await request.get("/order-success")
  36 |     expect(res.status()).toBe(200)
  37 |     await page.goto("/order-success")
  38 |     await expect(page.locator("body")).not.toBeEmpty()
  39 |   })
  40 | })
  41 | 
```