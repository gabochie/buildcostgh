import { prisma } from "./src/lib/prisma"

async function safe(label: string, fn: () => Promise<unknown>) {
  try {
    const v = await fn()
    console.log(`${label}: ${JSON.stringify(v)}`)
  } catch (e: any) {
    console.log(`${label}: ERROR ${e.code ?? e.message}`)
  }
}

async function main() {
  await safe("orders", () => prisma.order.count())
  await safe("calculatorLead", () => prisma.calculatorLead.count())
  await safe("contactMessage", () => prisma.contactMessage.count())
  await safe("newsletterSubscriber", () => prisma.newsletterSubscriber.count())
  await safe("user", () => prisma.user.count())
  await safe("job", () => prisma.job.count())
  await safe("adminLoginAttempt", () => prisma.adminLoginAttempt.count())
  await safe("cofounderGoal", () => prisma.cofounderGoal.count())
  await safe("cofounderTask", () => prisma.cofounderTask.count())
  const recentOrders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 3, select: { reference: true, package: true, amount: true, status: true, createdAt: true } }).catch((e: any) => `ERROR ${e.code}`)
  console.log("recentOrders:", JSON.stringify(recentOrders))
}

main().finally(() => prisma.$disconnect())
