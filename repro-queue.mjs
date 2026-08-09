// Repro: replicate processNextJob's exact transaction against the PROD database
import fs from "fs"
import { fileURLToPath } from "url"
import path from "path"

const envPath = "C:/Users/user/AppData/Local/Temp/opencode/vercel-env-prod.env"
const env = fs.readFileSync(envPath, "utf8")
for (const line of env.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "")
}

const { PrismaClient } = await import("@prisma/client")
const prisma = new PrismaClient()

console.log("DATABASE_URL host:", process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] || "N/A")

try {
  const start = Date.now()
  const job = await prisma.$transaction(async (tx) => {
    const [next] = await tx.$queryRaw`SELECT id FROM "Job" WHERE status = 'pending' AND "scheduledAt" <= NOW() ORDER BY "scheduledAt" ASC LIMIT 1 FOR UPDATE SKIP LOCKED`
    return next ?? null
  })
  console.log("TRANSACTION OK in", Date.now() - start, "ms — result:", JSON.stringify(job))

  const start2 = Date.now()
  const [pending, failed] = await Promise.all([
    prisma.job.count({ where: { status: "pending" } }),
    prisma.job.count({ where: { status: "failed" } }),
  ])
  console.log("COUNTS OK in", Date.now() - start2, "ms — pending:", pending, "failed:", failed)
} catch (e) {
  console.error("REPRO FAILED:")
  console.error(e)
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
