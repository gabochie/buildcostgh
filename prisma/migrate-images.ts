import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const imageMap: Record<string, string> = {
  "house-cost-ghana-2026": "/assets/blog/img-house-cost.jpg",
  "2-bedroom-house-cost-ghana-2026": "/assets/blog/img-2bedroom.jpg",
  "5-bedroom-house-cost-ghana-2026": "/assets/blog/img-luxury-house.jpg",
  "bungalow-cost-ghana": "/assets/blog/img-bungalow.jpg",
  "duplex-cost-ghana": "/assets/blog/img-duplex.jpg",
  "4-bedroom-house-cost-ghana": "/assets/blog/img-4bedroom.jpg",
  "regional-cost-comparison-ghana": "/assets/blog/img-region.jpg",
  "accra-kumasi-takoradi-building-cost-comparison": "/assets/blog/img-region.jpg",
  "building-materials-prices-ghana-2026": "/assets/blog/img-budget.jpg",
  "land-prices-ghana-2026": "/assets/blog/img-region.jpg",
  "hidden-costs-building-house-ghana": "/assets/blog/img-budget.jpg",
  "top-10-budget-tips-building-ghana": "/assets/blog/img-budget.jpg",
  "foundation-roofing-costs-ghana": "/assets/blog/img-foundation.jpg",
  "roofing-types-ghana-2026": "/assets/blog/img-foundation.jpg",
  "house-finishing-costs-ghana": "/assets/blog/img-finishing.jpg",
  "plumbing-electrical-costs-ghana-2026": "/assets/blog/img-foundation.jpg",
  "building-permits-ghana-2026": "/assets/blog/img-permits.jpg",
  "contractor-vs-diy-ghana": "/assets/blog/img-contractor.jpg",
  "choose-right-contractor-ghana": "/assets/blog/img-contractor.jpg",
  "architect-vs-building-technologist-ghana": "/assets/blog/img-contractor.jpg",
  "common-building-mistakes-ghana": "/assets/blog/img-budget.jpg",
  "ghana-construction-timeline-2026": "/assets/blog/img-contractor.jpg",
  "phased-house-building-ghana": "/assets/blog/img-budget.jpg",
  "step-by-step-guide-building-ghana": "/assets/blog/img-stepguide.jpg",
  "diaspora-building-guide-ghana": "/assets/blog/img-diaspora.jpg",
  "solar-power-houses-ghana-2026": "/assets/blog/img-house-cost.jpg",
  "ghana-house-floor-plans-2026": "/assets/blog/img-4bedroom.jpg",
  "rental-property-investment-ghana-2026": "/assets/blog/img-duplex.jpg",
  "ghana-housing-market-trends-2026": "/assets/blog/img-region.jpg",
  "bill-of-quantities-ghana-2026": "/assets/blog/img-contractor.jpg",
}

async function main() {
  for (const [slug, imageUrl] of Object.entries(imageMap)) {
    await prisma.blogPost.updateMany({
      where: { slug },
      data: { imageUrl },
    })
  }
  console.log(`Updated images for ${Object.keys(imageMap).length} posts`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
