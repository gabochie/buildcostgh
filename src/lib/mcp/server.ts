import { prisma } from "@/lib/prisma"
import { logAgentAction } from "@/lib/agent-log"
import { generateReportForOrder } from "@/lib/jobs"
import type { Prisma } from "@prisma/client"

const BASE_PRICES: Record<number, number> = { 1: 80000, 2: 120000, 3: 180000, 4: 250000, 5: 400000 }
const GRADE_MULTIPLIERS: Record<string, number> = { C: 1.0, B: 1.5, A: 2.5 }
const ADDON_COSTS: Record<string, number> = { pool: 50000, garden: 15000, security: 8000, solar: 25000 }

type ToolResult = { content: Array<{ type: string; text: string }>; isError?: boolean }
type ToolArgs = {
  bedrooms?: number
  location?: string
  floorArea?: number
  floors?: number
  grade?: string
  addons?: string[]
  email?: string
  fullName?: string
  phone?: string
  packageName?: string
  amount?: number
  reference?: string
  orderReference?: string
  currency?: string
  month?: number
  region?: string
  question?: string
  status?: string
  category?: string
  limit?: number
}

function estimateLocationMultiplier(location: string): number {
  const loc = location.toLowerCase()
  if (loc.includes("accra") || loc.includes("tema")) return 1.0
  if (loc.includes("kumasi")) return 0.85
  if (loc.includes("takoradi") || loc.includes("sekyeres")) return 0.9
  if (loc.includes("tamale")) return 0.75
  return 0.85
}

export async function executeTool(name: string, args: ToolArgs): Promise<ToolResult> {
  await logAgentAction({
    agent: "MCP",
    action: `tool_${name}`,
    level: "info",
    details: { args },
  })

  try {
    let result: unknown

    switch (name) {
      case "get_cost_estimate": {
        const bedrooms = args.bedrooms || 3
        const location = args.location || "Accra"
        const floorArea = args.floorArea || bedrooms * 55
        const floors = args.floors || 1
        const grade = (args.grade || "B").toUpperCase()
        const addons: string[] = args.addons || []

        const base = (BASE_PRICES[bedrooms] || BASE_PRICES[3]) * (floorArea / (bedrooms * 55))
        const locMultiplier = estimateLocationMultiplier(location)
        const gradeMultiplier = GRADE_MULTIPLIERS[grade] || GRADE_MULTIPLIERS.B

        let total = base * locMultiplier * gradeMultiplier
        const addonCosts: Record<string, number> = {}
        for (const addon of addons) {
          const cost = ADDON_COSTS[addon.toLowerCase()] || 0
          addonCosts[addon] = cost
          total += cost
        }

        result = {
          breakdown: {
            foundation: Math.round(base * 0.18 * locMultiplier * gradeMultiplier),
            structure: Math.round(base * 0.34 * locMultiplier * gradeMultiplier),
            finishing: Math.round(base * 0.38 * locMultiplier * gradeMultiplier),
            services: Math.round(base * 0.10 * locMultiplier * gradeMultiplier),
          },
          addons: addonCosts,
          total: Math.round(total),
          currency: "GHS",
          parameters: { bedrooms, location, floorArea, floors, grade, addons },
          note: "Estimates are indicative. Contact a qualified quantity surveyor for detailed costings.",
        }
        break
      }

      case "create_order": {
        const reference = `BCG-MCP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
        const order = await prisma.order.create({
          data: {
            email: args.email ?? "",
            fullName: args.fullName ?? "",
            phone: args.phone || "",
            package: args.packageName ?? "",
            amount: args.amount ?? 0,
            reference,
            status: "pending",
          },
        })
        result = { id: order.id, reference: order.reference, status: order.status }
        break
      }

      case "get_order_status": {
        const order = await prisma.order.findUnique({ where: { reference: args.reference } })
        if (!order) {
          return { content: [{ type: "text", text: "Order not found" }], isError: true }
        }
        result = {
          id: order.id, reference: order.reference, status: order.status,
          package: order.package, amount: order.amount, currency: order.currency,
          fullName: order.fullName, email: order.email,
          reportUrl: order.reportUrl,
          createdAt: order.createdAt.toISOString(),
        }
        break
      }

      case "get_market_pricing": {
        const currency = args.currency || "GHS"
        const packages = await prisma.order.groupBy({
          by: ["package"],
          _sum: { amount: true },
          _count: true,
        })
        result = {
          tiers: [
            { id: "free", name: "Free Trial", price: 0, currency },
            { id: "basic", name: "Basic", price: 99, currency },
            { id: "detailed", name: "Detailed", price: 249, currency, popular: true },
            { id: "premium", name: "Premium", price: 499, currency },
          ],
          salesStats: packages.map(p => ({ package: p.package, sales: p._count, revenue: p._sum.amount })),
        }
        break
      }

      case "get_seasonal_factors": {
        const month = args.month || new Date().getMonth() + 1
        const where: Prisma.SeasonalFactorWhereInput = { active: true, month }
        if (args.region) where.region = args.region

        const factors = await prisma.seasonalFactor.findMany({ where })

        const peakMonths = [11, 12, 1, 2, 3]
        const isPeak = peakMonths.includes(month)

        result = {
          month,
          season: isPeak ? "peak (dry season, Nov-Mar)" : "off-peak (rainy season, Apr-Oct)",
          activeFactors: factors,
          recommendation: isPeak
            ? "Peak construction season. Expect higher material demand and prices."
            : "Off-peak season. Potential for better contractor availability and material discounts.",
        }
        break
      }

      case "ask_assistant": {
        const faqs: Record<string, string> = {
          "cost": "Construction costs in Ghana range from GHS 80,000 for a 1-bedroom to GHS 400,000+ for a 5-bedroom house, depending on location, grade, and features. Use our calculator at buildcostgh.com/calculator for a personalized estimate.",
          "time": "Building a house in Ghana typically takes 4-18 months depending on size, funding, and season. Dry season (Nov-Mar) is best for construction.",
          "diaspora": "We offer diaspora-specific features including USD pricing, remote project management tips, and vetted contractor contacts. Our platform is built specifically for Ghanaians abroad.",
          "permit": "You need building permits from the local district assembly. Costs vary by region. We recommend engaging a local architect or quantity surveyor to handle permits.",
        }
        const question = (args.question ?? "").toLowerCase()
        const answer = Object.entries(faqs).find(([key]) => question.includes(key))?.[1]
          || "I can help with construction costs in Ghana. Try asking about costs, building timelines, diaspora building, or permits. For a precise estimate, use our calculator at buildcostgh.com/calculator."
        result = { answer, source: "knowledge-base" }
        break
      }

      case "get_lead_score": {
        const lead = await prisma.calculatorLead.findFirst({
          where: { email: args.email },
          orderBy: { createdAt: "desc" },
        })
        const subscriber = await prisma.newsletterSubscriber.findUnique({
          where: { email: args.email },
        })
        const orders = await prisma.order.findMany({
          where: { email: args.email },
          orderBy: { createdAt: "desc" },
        })

        let score = 0
        if (lead) score += 20
        if (lead?.bedrooms) score += 15
        if (lead?.location) score += 10
        if (subscriber?.subscribed) score += 10
        if (orders.length > 0) score += 25 + (orders.filter(o => o.status === "completed").length * 10)

        result = {
          email: args.email,
          score: Math.min(score, 100),
          hasCalculatorLead: !!lead,
          hasSubscription: !!subscriber?.subscribed,
          hasOrdered: orders.length > 0,
          completedOrders: orders.filter(o => o.status === "completed").length,
          tier: score >= 70 ? "hot" : score >= 40 ? "warm" : "cold",
        }
        break
      }

      case "list_orders": {
        const where: Prisma.OrderWhereInput = {}
        if (args.status) where.status = args.status as string
        const orders = await prisma.order.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: Math.min(args.limit || 20, 100),
        })
        result = orders.map(o => ({
          id: o.id, reference: o.reference, fullName: o.fullName,
          email: o.email, package: o.package, amount: o.amount,
          status: o.status, createdAt: o.createdAt.toISOString(),
        }))
        break
      }

      case "list_blog_posts": {
        const where: Prisma.BlogPostWhereInput = { published: true }
        if (args.category) where.category = args.category as string
        const posts = await prisma.blogPost.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: Math.min(args.limit || 10, 50),
          select: { title: true, slug: true, excerpt: true, category: true, createdAt: true },
        })
        result = posts
        break
      }

      case "trigger_report": {
        const order = await prisma.order.findUnique({ where: { reference: args.orderReference } })
        if (!order) {
          return { content: [{ type: "text", text: "Order not found" }], isError: true }
        }
        if (order.status !== "completed") {
          return { content: [{ type: "text", text: `Order status is "${order.status}", must be "completed"` }], isError: true }
        }
        const reportUrl = await generateReportForOrder(order.id)
        result = { message: "Report generated", orderReference: order.reference, reportUrl }
        break
      }

      default:
        return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true }
    }

    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
  } catch (err) {
    await logAgentAction({
      agent: "MCP",
      action: `tool_error_${name}`,
      level: "error",
      details: { args, error: err instanceof Error ? err.message : String(err) },
    })
    return { content: [{ type: "text", text: `Error executing ${name}: ${err instanceof Error ? err.message : String(err)}` }], isError: true }
  }
}
