import { prisma } from "@/lib/prisma"
import { homepageFaqs, pricingFaqs, calculatorFaqs, affiliatesFaqs } from "@/lib/seo/faqs"
import { services } from "@/lib/services"

export const dynamic = "force-dynamic"

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://buildcostgh.com"

  const posts = await prisma.blogPost
    .findMany({ where: { published: true }, orderBy: { createdAt: "desc" }, take: 50 })
    .catch(() => [])

  const regionRates = await prisma.regionRate
    .findMany({ where: { published: true }, orderBy: { multiplier: "desc" } })
    .catch(() => [])

  const sections = [
    "# BuildCost GH (llms-full.txt)",
    "",
    "> BuildCost GH is a construction cost estimation platform for Ghana. It gives Ghanaians and the African diaspora instant, data-driven cost estimates for building houses in Ghana, based on real market data from all 16 regions.",
    "",
    "## Core pages\n",
    ...[
      "- [Home](https://buildcostgh.com/): Construction cost estimates for Ghana, built for Ghanaians and the diaspora.",
      "- [Calculator](https://buildcostgh.com/calculator): Free instant cost estimate for residential construction in Ghana.",
      "- [Regional Cost Database](https://buildcostgh.com/costs): Live construction material and labour rates for all 16 regions of Ghana, updated monthly.",
      "- [How It Works](https://buildcostgh.com/how-it-works): How BuildCost GH estimates costs.",
      "- [Pricing](https://buildcostgh.com/pricing): One-time reports and unlimited subscriptions, payable by card or mobile money.",
      "- [Services](https://buildcostgh.com/services): All BuildCost GH services.",
      "- [Blog](https://buildcostgh.com/blog): Construction cost guides for Ghana.",
      "- [Flood-Safe Land](https://buildcostgh.com/flood-safe-land): Flood risk guidance for Ghana land buyers.",
      "- [Contractors](https://buildcostgh.com/contractors): Vetted construction contractors in Ghana.",
      "- [Contact](https://buildcostgh.com/contact): Contact us.",
    ],
    "",
    "## Regional cost data (Ghana, updated monthly)\n",
    "Baseline: Greater Accra = 1.00x. Rates in GHS. Source: supplier surveys + NPA fuel benchmark + BuildCost GH field data.",
    ...regionRates.map(
      (r) =>
        `- [${r.name} (${r.capital})](${baseUrl}/costs/${r.slug}): cost factor ${r.multiplier.toFixed(2)}x Accra; cement GHS ${r.cementBag}/50kg bag; rebar GHS ${r.rebarTon}/tonne; skilled labour GHS ${r.labourRate}/day; diesel GHS ${r.dieselLit}/litre; block GHS ${r.block}; sand GHS ${r.sandTrip}/trip; granite GHS ${r.graniteTrip}/trip; roofing GHS ${r.roofingSqm}/SQM installed.`,
    ),
    "",
    "## Services\n",
    ...services.map(
      (s) => `- [${s.title}](${baseUrl}/services/${s.slug}): ${s.description}`,
    ),
    "",
    "## Homepage FAQ\n",
    ...homepageFaqs.map((f) => `- ${f.q}: ${f.a}`),
    "",
    "## Calculator FAQ\n",
    ...calculatorFaqs.map((f) => `- ${f.q}: ${f.a}`),
    "",
    "## Pricing FAQ\n",
    ...pricingFaqs.map((f) => `- ${f.q}: ${f.a}`),
    "",
    "## Affiliate FAQ\n",
    ...affiliatesFaqs.map((f) => `- ${f.q}: ${f.a}`),
    "",
    "## Blog articles\n",
    ...posts.map((p) => `- [${p.title}](${baseUrl}/blog/${p.slug}): ${p.excerpt || ""}`),
    "",
    "## Business & legal\n",
    ...[
      "- [API Pricing](https://buildcostgh.com/api-pricing)",
      "- [API Docs](https://buildcostgh.com/api-docs)",
      "- [Affiliates](https://buildcostgh.com/affiliates)",
      "- [Investors](https://buildcostgh.com/investors)",
      "- [Careers](https://buildcostgh.com/careers)",
      "- [Press Kit](https://buildcostgh.com/press-kit)",
      "- [Privacy](https://buildcostgh.com/privacy)",
      "- [Terms](https://buildcostgh.com/terms)",
      "- [Disclaimer](https://buildcostgh.com/disclaimer)",
      "- [Refund Policy](https://buildcostgh.com/refund)",
      "- [Cookies](https://buildcostgh.com/cookies)",
    ],
  ]

  return new Response(sections.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
