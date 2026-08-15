import { PrismaClient } from "@prisma/client"

const u = process.env.DATABASE_URL ?? "UNSET"
console.log("ENV DATABASE_URL host:", new URL(u).host)
console.log("ENV DATABASE_URL db:", new URL(u).pathname)

const prisma = new PrismaClient()

async function m() {
  const db = await prisma.$queryRawUnsafe("SELECT current_database() AS db, inet_server_addr() AS ip")
  console.log("connected to:", JSON.stringify(db))
  const count = await prisma.regionRate.count()
  console.log("regionRate count:", count)
  await prisma.$disconnect()
}
m().catch((e) => { console.error(e.message); process.exit(1) })
