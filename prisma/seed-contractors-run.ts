import { PrismaClient } from "@prisma/client"
import { seedContractorsFromResearch, type ResearchContractor } from "./seed-contractors"
import contractorsData from "./contractors-data.json"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding contractor directory...")

  const contractors = contractorsData as ResearchContractor[]

  const result = await seedContractorsFromResearch(prisma, contractors)

  console.log(`Done. Created: ${result.created}, Updated: ${result.updated}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
