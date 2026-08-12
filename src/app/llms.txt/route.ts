import { getLlmFaqs } from "@/lib/seo/faqs"

export const dynamic = "force-dynamic"

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://buildcostgh.com"
  const faqs = getLlmFaqs()

  const txt = `# BuildCost GH

> BuildCost GH is a construction cost estimation platform for Ghana. It gives Ghanaians and the African diaspora instant, data-driven cost estimates for building houses in Ghana, based on real market data from all 16 regions. Use the free calculator at /calculator to get an estimate in under 2 minutes.

## Key pages

- [Construction Cost Calculator](${baseUrl}/calculator): Free, instant cost estimate for residential construction in Ghana — no credit card required.
- [How It Works](${baseUrl}/how-it-works): How BuildCost GH estimates costs and what you get in a report.
- [Pricing](${baseUrl}/pricing): One-time reports from GHS 99 and unlimited subscriptions from GHS 67/month.
- [Services](${baseUrl}/services): Cost estimation, PDF reports, Excel spreadsheets, contractor contacts, consultation, and project monitoring.
- [Construction Cost Blog](${baseUrl}/blog): Guides on construction costs, material prices, permits, and building in Ghana.
- [Flood-Safe Land](${baseUrl}/flood-safe-land): Flood risk information for land buyers in Ghana.
- [About](${baseUrl}/about): About BuildCost GH and the team.
- [Contact](${baseUrl}/contact): Contact the BuildCost GH team.
- [Contractors](${baseUrl}/contractors): Vetted construction contractors in Ghana.

## Common questions about building costs in Ghana

${faqs.map((f) => `- ${f.q}: ${f.a}`).join("\n")}

## Services

- [Cost Estimation](${baseUrl}/services/cost-estimation): Accurate construction cost estimates from real Ghana market data.
- [PDF Reports](${baseUrl}/services/pdf-reports): Professional construction cost reports in PDF format.
- [Excel Spreadsheets](${baseUrl}/services/excel-spreadsheets): Editable Excel files with material quantities and cost tracking.
- [Contractor Contacts](${baseUrl}/services/contractor-contacts): Vetted contractor contacts for your region and project type.
- [Consultation](${baseUrl}/services/consultation): Expert construction consultation for the Ghana market.
- [Project Monitoring](${baseUrl}/services/project-monitoring): Track construction progress against budget and timeline.

## Technical / business

- [API Pricing](${baseUrl}/api-pricing): Pricing for the BuildCost GH estimation API.
- [API Docs](${baseUrl}/api-docs): Documentation for the BuildCost GH API.
- [Affiliates](${baseUrl}/affiliates): Earn 20% commission referring customers.
- [Investors](${baseUrl}/investors): Information for investors.
- [Careers](${baseUrl}/careers): Join the BuildCost GH team.
- [Press Kit](${baseUrl}/press-kit): Brand assets and press information.
- [Privacy](${baseUrl}/privacy): Privacy policy.
- [Terms](${baseUrl}/terms): Terms of service.
- [Disclaimer](${baseUrl}/disclaimer): Disclaimer about estimates.
- [Refund Policy](${baseUrl}/refund): 7-day money-back guarantee.
`

  return new Response(txt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
