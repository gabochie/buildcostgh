import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [totalOrders, completedOrders, pendingOrders, totalRevenue, totalMessages, unreadMessages, totalLeads, totalSubscribers] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "completed" } }),
    prisma.order.count({ where: { status: "pending" } }),
    prisma.order.aggregate({ where: { status: "completed" }, _sum: { amount: true } }),
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { read: false } }),
    prisma.calculatorLead.count(),
    prisma.newsletterSubscriber.count(),
  ])

  return NextResponse.json({
    totalOrders,
    completedOrders,
    pendingOrders,
    totalRevenue: totalRevenue._sum.amount || 0,
    totalMessages,
    unreadMessages,
    totalLeads,
    totalSubscribers,
  })
}
