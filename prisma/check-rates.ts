import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()
async function main() {
  const count = await p.regionRate.count()
  const top = await p.regionRate.findMany({ orderBy: { multiplier: "desc" }, take: 3 })
  console.log("COUNT", count)
  console.log(JSON.stringify(top, null, 2))
}
main().finally(() => p.$disconnect())
