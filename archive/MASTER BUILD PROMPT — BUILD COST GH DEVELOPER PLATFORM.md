# MASTER BUILD PROMPT — BUILD COST GH DEVELOPER PLATFORM

## ROLE

You are a senior product architect, UX designer, developer-platform engineer, API product strategist, and technical copywriter.

You are working on **BuildCostGH**, a Ghana-focused construction cost intelligence platform.

Website:

**https://buildcostgh.com**

The website already contains a **Developers** section in the footer with links conceptually corresponding to:

- API Docs
- API Pricing
- Quick Start

Your task is to transform this into a **professional, production-ready Developer Platform** embedded naturally inside the BuildCostGH website.

Do NOT build a generic marketing page.

Build an actual developer-facing information architecture and interface that can eventually support a larger **AEC Data & API Exchange for Ghana and Africa**.

---

# 1. PRODUCT VISION

BuildCostGH should evolve from a construction-cost information platform into infrastructure that allows software developers, PropTech companies, ConTech companies, AEC firms, architects, quantity surveyors, contractors, developers, researchers, and AI agents to access structured built-environment intelligence through APIs.

The long-term positioning is:

> **The API infrastructure layer for Africa's built environment.**

However, do NOT overclaim the current product.

The current platform should clearly communicate what APIs/data are actually available today.

Future categories may include:

- Construction Costs
- Material Prices
- Labour Rates
- BOQ
- Project Estimation
- Property Intelligence
- Development Intelligence
- GIS
- Infrastructure
- Contractors
- Suppliers
- Planning
- Climate/Risk
- AEC AI
- Geometry/Computation
- Other verified built-environment datasets

Only expose products that actually exist.

Use “Coming Soon” or “Future APIs” for capabilities that are not yet operational.

---

# 2. PRIMARY URL STRUCTURE

Create the following information architecture:

/developers/

/developers/docs/

/developers/pricing/

/developers/quick-start/

/developers/api-reference/

/developers/changelog/

/developers/status/

If the current website architecture or CMS requires different URLs, preserve the site's existing routing conventions while maintaining the same conceptual structure.

The footer should contain:

## Developers

- Developer Overview
- API Docs
- API Pricing
- Quick Start
- API Reference
- Changelog
- API Status

---

# 3. DEVELOPER OVERVIEW PAGE

Create:

## /developers/

Page title:

> BuildCostGH Developers

Hero headline:

> Build with Ghana's construction cost intelligence.

Supporting copy:

> Access structured construction-cost and built-environment data through developer-friendly APIs designed for applications, platforms, AI agents, and professional workflows.

Primary CTA:

> Get API Access

Secondary CTA:

> Read the Docs

Third CTA if appropriate:

> View API Reference

Do NOT use exaggerated claims such as “Africa's largest construction API” unless objectively verified.

---

# 4. HERO DESIGN

Create a developer-platform style hero.

The visual language should be inspired by serious infrastructure/developer platforms rather than consumer SaaS.

Use:

- clean typography
- technical grid
- subtle data visualizations
- code snippets
- API endpoint examples
- structured cards
- minimal decorative elements
- excellent whitespace
- responsive layout

Avoid:

- excessive gradients
- cheesy AI imagery
- stock construction photos
- generic corporate illustrations
- excessive animations

The page should immediately communicate:

> “This is infrastructure developers can integrate.”

---

# 5. HERO CODE EXAMPLE

Include a live-looking API request example.

Example:

```bash
curl https://api.buildcostgh.com/v1/...
  -H "Authorization: Bearer YOUR_API_KEY"
```

Show a corresponding JSON response.

Use realistic but clearly illustrative fields.

For example:

```json
{
  "location": "Accra",
  "project_type": "residential",
  "currency": "GHS",
  "data": {
    "category": "construction_cost",
    "unit": "sqm"
  }
}
```

Do not fabricate real production endpoints if they do not exist.

If an endpoint does not yet exist, label the example:

> Example response

or:

> Coming soon

---

# 6. “WHAT CAN YOU BUILD?” SECTION

Create a section showing possible applications developers can build using BuildCostGH APIs.

Cards:

### Construction Estimators
Integrate Ghana-specific cost intelligence into estimation software.

### BOQ Tools
Build digital quantity-surveying and BOQ workflows.

### Property Platforms
Add construction-cost intelligence to property and development applications.

### Developer Feasibility Tools
Estimate project costs during early-stage development decisions.

### Architecture Platforms
Connect cost intelligence directly to design and project workflows.

### AI Agents
Give AI agents structured construction-cost intelligence for Ghana.

### ConTech Platforms
Build construction applications on top of structured local data.

### PropTech Platforms
Combine property and construction intelligence into development tools.

Each card should have:

- icon
- title
- 1–2 sentence description
- optional “Explore API” CTA

---

# 7. API PRODUCTS

Create a clear API product catalogue.

Start with actual BuildCostGH products.

Possible structure:

### Construction Cost API

Access structured construction-cost data for Ghanaian projects.

Status:
AVAILABLE / BETA / COMING SOON

### Material Price API

Access structured material pricing data.

Status:
AVAILABLE / BETA / COMING SOON

### BOQ API

Build or integrate quantity and cost estimation workflows.

Status:
COMING SOON if not operational.

### Project Estimation API

Generate structured project cost estimates.

Status:
COMING SOON if not operational.

Do NOT pretend an API exists simply because the concept has been designed.

Each product card should include:

- API name
- description
- status
- version
- endpoint count if known
- authentication type
- documentation link
- pricing link
- “Try API” where applicable

---

# 8. API CATALOGUE ARCHITECTURE

Build the catalogue so it can scale.

Use categories:

## Cost Intelligence

- Construction Cost API
- Material Price API
- Labour Rate API
- Cost Index API

## Estimation

- BOQ API
- Project Estimation API
- Quantity API

## Property & Development

- Property Intelligence API
- Development Feasibility API
- Land Intelligence API

## Geospatial

- Site Intelligence API
- GIS API
- Building Data API

## Infrastructure

- Roads API
- Utilities API
- Public Infrastructure API

## Professional Ecosystem

- Contractor API
- Supplier API
- Consultant API

## AI

- Construction AI API
- Estimation AI API
- Feasibility AI API

Only mark currently operational APIs as available.

Everything else must clearly show:

> Coming Soon

---

# 9. API DOCUMENTATION

Build:

## /developers/docs/

Create a professional documentation interface.

Desktop layout:

```text
┌─────────────────────────────────────────────┐
│ BuildCostGH Developers                      │
├──────────────┬──────────────────────────────┤
│ Sidebar      │ Documentation                 │
│              │                              │
│ Introduction │ Getting Started              │
│ Authentication│                             │
│ API Keys     │                              │
│ Rate Limits  │                              │
│ Errors       │                              │
│ Pagination   │                              │
│ Webhooks     │                              │
│ Versions     │                              │
│ SDKs         │                              │
│              │                              │
└──────────────┴──────────────────────────────┘
```

Documentation should support:

- anchor links
- searchable navigation
- syntax-highlighted code
- copy buttons
- language tabs
- responsive navigation
- breadcrumbs
- previous/next documentation navigation

---

# 10. QUICK START

Create:

## /developers/quick-start/

Structure:

### Step 1 — Create an Account

Explain how developers obtain access.

### Step 2 — Generate an API Key

Explain API authentication.

Example:

```text
Authorization: Bearer YOUR_API_KEY
```

### Step 3 — Make Your First Request

Show:

- cURL
- JavaScript
- Python

Example:

```javascript
const response = await fetch(
  "https://api.buildcostgh.com/v1/...",
  {
    headers: {
      Authorization: `Bearer ${process.env.BUILDCOSTGH_API_KEY}`
    }
  }
);

const data = await response.json();
```

### Step 4 — Read the Response

Show example JSON.

### Step 5 — Build

Explain how to proceed from testing to production.

---

# 11. API PRICING

Create:

## /developers/pricing/

The pricing page must be transparent and developer-friendly.

Suggested structure:

### Free / Sandbox

For development and testing.

Include:

- limited requests
- sandbox data
- API documentation
- developer account

### Developer

For small applications.

Include:

- larger request allowance
- production API access
- usage analytics

### Professional

For commercial applications.

Include:

- higher limits
- commercial usage
- priority support

### Enterprise

For:

- PropTech platforms
- ConTech companies
- AEC enterprises
- institutions
- government
- large-scale applications

CTA:

> Contact BuildCostGH

Do NOT invent prices unless actual pricing has been established.

Use:

> Pricing coming soon

or configurable placeholders.

The underlying UI should make prices easy to change later.

---

# 12. API KEY / ACCESS FLOW

Design the developer journey around:

```text
Developer Overview
       ↓
Choose API
       ↓
Read Documentation
       ↓
Create Account
       ↓
Generate API Key
       ↓
Sandbox
       ↓
Test API
       ↓
Choose Plan
       ↓
Production
       ↓
Monitor Usage
```

If BuildCostGH does not currently have authentication/account infrastructure, create the UI architecture and clearly label unavailable functionality.

Do not fake a functioning API key-generation system.

---

# 13. API REFERENCE

Create:

## /developers/api-reference/

Design this as the future technical reference layer.

Include:

- API version selector
- endpoint grouping
- HTTP method badges
- endpoint path
- parameters
- request body
- response schema
- response examples
- authentication
- error codes
- copy buttons
- “Try it” interface where technically possible

Example:

```text
GET /v1/construction-costs
```

Parameters:

```text
location
project_type
building_type
currency
date
```

Response:

```json
{
  "data": [],
  "meta": {}
}
```

Do not expose fictional production endpoints as live.

---

# 14. DEVELOPER DASHBOARD — FUTURE-READY

Architect the UI so a future authenticated dashboard can contain:

```text
Dashboard

API Usage
Requests
Errors
Latency

API Keys
Production
Sandbox

Products
Subscriptions

Billing

Logs

Documentation

Support
```

The initial website does not necessarily need to implement all of this.

But the information architecture must allow it to be added later without redesigning the entire Developer Platform.

---

# 15. CHANGELOG

Create:

## /developers/changelog/

Use a technical changelog format.

Example:

```text
August 2026

BuildCostGH API v1
Added:
• Initial construction-cost endpoints
• API authentication
• Developer documentation

July 2026

Developer Platform
Added:
• Developer portal
• API documentation
• Quick Start
```

Only publish real changes.

If there are no actual releases yet, show:

> No API releases yet.

---

# 16. API STATUS

Create:

## /developers/status/

Build a professional status page.

Potential services:

```text
BuildCostGH API       Operational
Authentication        Operational
Documentation         Operational
Sandbox               Operational
Developer Dashboard   Coming Soon
```

Do not falsely claim operational uptime monitoring.

If no monitoring backend exists, create the UI as a future-ready placeholder.

---

# 17. DEVELOPER FOOTER

Update the existing footer Developers column.

Recommended:

### Developers

Developer Portal  
API Docs  
API Pricing  
Quick Start  
API Reference  
Changelog  
API Status

Keep the existing website's footer styling and visual hierarchy.

Do not make the footer excessively large.

---

# 18. NAVIGATION

Do not necessarily place all developer pages in the primary consumer navigation.

The main BuildCostGH navigation should remain focused on the core product.

The Developer Portal can be accessed through:

Footer:

> Developers

And optionally through a small header link:

> Developers

Once the developer ecosystem becomes substantial, consider:

> Developers ▾

with:

```text
Developer Portal
API Documentation
API Reference
Pricing
Changelog
```

---

# 19. SEO

Optimize:

/developers/

Title:

> BuildCostGH Developers | Construction Cost APIs for Ghana

Meta description:

> Build applications with BuildCostGH construction cost and built-environment APIs for Ghana.

Create appropriate metadata for each developer page.

Avoid keyword stuffing.

Target concepts naturally including:

- Ghana construction API
- construction cost API Ghana
- construction data API
- Ghana property API
- ConTech API
- PropTech API
- AEC API
- construction pricing API
- quantity surveying API
- building cost data Ghana

Do not claim services that do not currently exist.

---

# 20. DESIGN SYSTEM

The Developer Portal must visually belong to BuildCostGH.

Reuse:

- existing logo
- existing typography
- existing color system
- existing spacing
- existing buttons
- existing cards
- existing header/footer

But introduce a subtle developer/infrastructure layer through:

- code blocks
- monospace typography for technical elements
- API endpoint chips
- JSON previews
- technical tables
- status badges
- documentation navigation
- subtle grid patterns

The result should feel like:

**BuildCostGH + modern developer infrastructure.**

Not:

**BuildCostGH + random SaaS template.**

---

# 21. RESPONSIVENESS

The entire Developer Platform must work properly on:

- desktop
- laptop
- tablet
- mobile

Documentation is especially important.

On mobile:

- convert sidebar to dropdown/drawer
- keep code blocks horizontally scrollable
- keep API tables usable
- keep CTAs accessible
- avoid tiny text

---

# 22. ACCESSIBILITY

Implement:

- semantic HTML
- keyboard navigation
- visible focus states
- proper heading hierarchy
- accessible buttons
- accessible forms
- sufficient contrast
- meaningful labels
- ARIA only where necessary

---

# 23. PERFORMANCE

Do not introduce unnecessary JavaScript.

Prioritize:

- fast loading
- lightweight code blocks
- lazy loading
- minimal animation
- optimized assets
- no unnecessary third-party libraries

The Developer Portal itself should demonstrate that BuildCostGH takes technical quality seriously.

---

# 24. SECURITY

Never expose:

- API keys
- secret tokens
- database credentials
- private environment variables

Use:

```text
YOUR_API_KEY
```

in examples.

Do not place secrets in frontend source code.

Any real API key generation must happen server-side.

---

# 25. API VERSIONING

Design the platform around versioning from the beginning.

Use:

```text
/v1/
```

rather than unversioned endpoints.

Documentation should clearly identify:

```text
Current version: v1
```

Future versions should be able to coexist.

---

# 26. OPENAPI-FIRST ARCHITECTURE

Design the documentation architecture so BuildCostGH can eventually publish an OpenAPI specification.

Future file:

```text
/openapi/buildcostgh-v1.yaml
```

The API reference should ultimately be generated from the OpenAPI specification rather than maintained manually in multiple places.

This will make it possible to generate:

- documentation
- SDKs
- API clients
- validation
- testing
- code examples

from a common source of truth.

---

# 27. AI-READY ARCHITECTURE

BuildCostGH should eventually be usable not only by human developers but also by AI agents.

Design the documentation and API metadata so future support can include:

- machine-readable API descriptions
- OpenAPI
- structured schemas
- agent-readable documentation
- MCP integration
- tool definitions
- predictable JSON
- clear error responses

Do NOT build fake AI functionality now.

Prepare the architecture.

Long-term concept:

```text
BuildCostGH APIs
      ↓
OpenAPI
      ↓
SDKs
      ↓
MCP Tools
      ↓
AI Agents
      ↓
AEC Applications
```

This is strategically important.

---

# 28. MARKETPLACE-READY ARCHITECTURE

Do not hard-code the platform around only one API.

Create a reusable API product data model.

Conceptually:

```text
API Product

id
name
slug
description
category
provider
version
status
base_url
authentication
pricing
documentation_url
openapi_url
rate_limits
tags
created_at
updated_at
```

This means BuildCostGH can later become a marketplace for third-party AEC APIs.

Potential future providers could include:

- GIS providers
- property platforms
- material suppliers
- contractors
- government datasets
- climate data
- infrastructure data
- AEC software companies
- AI providers

The architecture should support this without requiring a complete rewrite.

---

# 29. TRUST & DATA PROVENANCE

Because construction and property data can affect real financial decisions, include a future-ready data transparency model.

For each API/data product, support:

```text
Data source
Last updated
Coverage
Geographic scope
Update frequency
Methodology
License
Accuracy notes
```

Do not make unsupported claims about accuracy.

This will become an important differentiator.

---

# 30. DEVELOPER TRUST PAGE

Include a section explaining:

> BuildCostGH APIs are designed to make Ghanaian construction intelligence easier to access, integrate and build upon.

Explain:

- data provenance
- API stability
- versioning
- documentation
- security
- usage limits
- support

Keep it concise.

---

# 31. CALL TO ACTION

The primary conversion should NOT simply be:

> Contact us.

The preferred developer journey is:

```text
Explore APIs
↓
Read Docs
↓
Quick Start
↓
Create Developer Account
↓
Get API Key
```

Where those systems aren't yet implemented, make the CTA:

> Request API Access

rather than pretending automated onboarding exists.

---

# 32. ANALYTICS

Prepare events for:

```text
developer_portal_view
api_docs_view
api_pricing_view
quick_start_view
api_reference_view
api_product_click
request_api_access
create_developer_account
copy_code
try_api
```

Use the site's existing analytics infrastructure where available.

Do not introduce unnecessary analytics services.

---

# 33. ADMIN / CONTENT MANAGEMENT

Where appropriate, make API products configurable rather than hard-coded.

An administrator should eventually be able to manage:

- API name
- description
- category
- status
- documentation URL
- pricing
- version
- endpoint count
- release date
- changelog
- provider
- availability

This is particularly important because BuildCostGH may eventually become an API marketplace.

---

# 34. DON'T BUILD A FAKE API

This is critical.

If the actual BuildCostGH API does not currently exist:

DO NOT:

- fake successful API calls
- fake authentication
- fake usage statistics
- fake uptime
- fake API keys
- claim endpoints are live
- invent pricing
- invent providers
- fabricate data

Instead clearly distinguish:

### LIVE

Actually operational.

### BETA

Operational but limited.

### COMING SOON

Designed/planned but not yet available.

### EXAMPLE

Illustrative documentation only.

Trust is more valuable than looking finished.

---

# 35. TECHNICAL QUALITY

Before declaring the work complete, test:

### Functional

- every developer link
- every CTA
- every anchor
- every documentation page
- mobile navigation
- code copy buttons
- API reference navigation
- pricing cards
- footer links

### Visual

- desktop
- tablet
- mobile
- dark/light mode if the existing website supports it
- typography
- spacing
- code blocks
- tables
- responsive documentation

### SEO

- titles
- descriptions
- canonical URLs
- headings
- sitemap inclusion
- robots rules

### Performance

- page load
- JavaScript
- CSS
- image optimization

### Security

- no secrets
- no API keys
- no exposed credentials
- safe forms

---

# 36. FINAL UX FLOW

The finished experience should communicate this:

```text
BUILD COST GH
      │
      ▼
DEVELOPERS
      │
      ├── Discover
      │     └── APIs
      │
      ├── Understand
      │     └── Documentation
      │
      ├── Start
      │     └── Quick Start
      │
      ├── Test
      │     └── Sandbox / API Console
      │
      ├── Integrate
      │     └── API Key
      │
      ├── Scale
      │     └── Pricing
      │
      └── Build
            └── Ghanaian AEC applications
```

---

# 37. LONG-TERM PRODUCT DIRECTION

Do not lose sight of the larger opportunity.

BuildCostGH can eventually evolve from:

```text
Construction Cost Website
```

into:

```text
Construction Intelligence Platform
```

then:

```text
Ghana AEC Data Platform
```

then:

```text
African AEC API Exchange
```

Potential long-term architecture:

```text
                    BUILD COST GH
                         │
                  Developer Platform
                         │
              ┌──────────┼──────────┐
              │          │          │
           DATA APIs   AI APIs   COMPUTE APIs
              │          │          │
         Property      AEC AI     BOQ
         GIS           QS AI      Cost
         Materials     Design AI  Geometry
         Infrastructure Planning  Feasibility
              │          │          │
              └──────────┼──────────┘
                         │
                    API GATEWAY
                         │
              ┌──────────┼──────────┐
              │          │          │
           PropTech    ConTech     AEC
           Startups    Platforms   Firms
              │          │          │
              └──────────┼──────────┘
                         │
                    AI AGENTS
```

The first implementation should be simple.

But the architecture should **not paint BuildCostGH into a corner**.

---

# 38. FINAL INSTRUCTION

Inspect the existing BuildCostGH website before making changes.

Determine:

- current technology
- CMS/framework
- existing design system
- header/footer
- typography
- color palette
- existing developer links
- existing API-related content
- existing authentication
- existing forms
- existing analytics
- existing backend/API infrastructure

Then implement the Developer Platform **inside the existing BuildCostGH ecosystem**, preserving brand consistency.

Do not rebuild unrelated areas of the website.

Do not remove existing functionality.

Do not fabricate APIs or data.

Build the **minimum production-quality developer portal now**, while making the architecture extensible enough to become the foundation of a future **Ghana/Africa AEC API Exchange**.

The final result should look credible enough that a professional software engineer could land on:

**buildcostgh.com/developers/**

and immediately understand:

1. What BuildCostGH provides.
2. What APIs are available.
3. What they can build.
4. How authentication works.
5. How to test an API.
6. How pricing works.
7. Where the technical reference is.
8. How to request access.
9. How the platform can eventually scale.

Build it as **developer infrastructure**, not as a decorative webpage.