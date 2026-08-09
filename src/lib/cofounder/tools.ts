import { prisma } from "@/lib/prisma"
import { executeTool } from "@/lib/mcp/server"
import { logAgentAction } from "@/lib/agent-log"
import { getPackagePriceUsd } from "@/lib/pricing"
import { computeRevenueUsd, getActiveGoal, ensureGoal, recentTasks } from "@/lib/cofounder/goal"
import { getSubagent, SUBAGENT_KEYS } from "@/lib/cofounder/subagents"

/**
 * Tools exposed to the cofounder's LLM via OpenAI function calling.
 * Each tool: JSON Schema for the model + a server-side execute() that
 * returns a JSON string. Tools that mutate business state stay read-mostly;
 * sending anything external (email, deploy, price change) is NOT exposed —
 * the cofounder can only draft, the founder approves and acts.
 */

export type CofounderTool = {
  name: string
  description: string
  parameters: Record<string, unknown>
  execute: (args: Record<string, unknown>) => Promise<string>
}

const json = (value: unknown) => JSON.stringify(value, null, 2)

export const cofounderTools: CofounderTool[] = [
  {
    name: "get_business_state",
    description:
      "Get the full current state of the business: revenue in USD (from completed orders), active goal progress, recent orders, leads, messages, and subscribers. Call this FIRST to ground every answer in real numbers.",
    parameters: { type: "object", properties: {} },
    execute: async () => {
      const [goal, { totalUsd, monthlyRevenue }, orders, leads, messages, subscribers, tasks] =
        await Promise.all([
          getActiveGoal(),
          computeRevenueUsd(),
          prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
          prisma.calculatorLead.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
          prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
          prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
          recentTasks(5),
        ])

      return json({
        revenueUsd: totalUsd,
        monthlyRevenue,
        goal: goal
          ? {
              id: goal.id,
              title: goal.title,
              targetAmount: goal.targetAmount,
              currency: goal.currency,
              periodStart: goal.periodStart,
              periodEnd: goal.periodEnd,
            }
          : null,
        recentOrders: orders.map((o) => ({
          reference: o.reference,
          fullName: o.fullName,
          email: o.email,
          package: o.package,
          amountUsd: getPackagePriceUsd(o.package),
          status: o.status,
          createdAt: o.createdAt,
        })),
        recentLeads: leads.map((l) => ({
          email: l.email,
          bedrooms: l.bedrooms,
          location: l.location,
          completed: l.completed,
          createdAt: l.createdAt,
        })),
        recentMessages: messages.map((m) => ({
          name: m.name,
          email: m.email,
          subject: m.subject,
          read: m.read,
          createdAt: m.createdAt,
        })),
        subscribers: subscribers.length,
        recentTasks: tasks.map((t) => ({ title: t.title, agent: t.agent, status: t.status })),
      })
    },
  },
  {
    name: "get_goal_state",
    description:
      "Get the current $1M/12-month goal progress: revenue vs target, pace per day, required per day, on-track forecast. Use when the user asks about progress or pace.",
    parameters: { type: "object", properties: {} },
    execute: async () => {
      const goal = await ensureGoal()
      const { totalUsd, monthlyRevenue } = await computeRevenueUsd()
      const start = goal.periodStart.getTime()
      const end = goal.periodEnd.getTime()
      const now = Date.now()
      const daysTotal = Math.max(1, Math.round((end - start) / 86_400_000))
      const daysElapsed = Math.min(daysTotal, Math.max(0, Math.round((now - start) / 86_400_000)))
      const daysRemaining = Math.max(0, daysTotal - daysElapsed)
      const percent = goal.targetAmount > 0 ? (totalUsd / goal.targetAmount) * 100 : 0
      const pace = daysElapsed > 0 ? totalUsd / daysElapsed : 0
      const required = daysRemaining > 0 ? Math.max(0, goal.targetAmount - totalUsd) / daysRemaining : 0
      const expectedNow = daysTotal > 0 ? goal.targetAmount * (daysElapsed / daysTotal) : 0
      const forecast = daysRemaining > 0 ? totalUsd + pace * daysRemaining : totalUsd

      return json({
        goal,
        revenueUsd: totalUsd,
        monthlyRevenue,
        percentComplete: Math.round(percent * 100) / 100,
        daysElapsed,
        daysTotal,
        daysRemaining,
        paceUsdPerDay: Math.round(pace),
        requiredUsdPerDay: Math.round(required),
        onTrack: totalUsd >= expectedNow,
        forecastUsd: Math.round(forecast),
      })
    },
  },
  {
    name: "get_cost_estimate",
    description:
      "Calculate a construction cost estimate for a building project in Ghana. Use for any pricing/estimate question from leads or customers.",
    parameters: {
      type: "object",
      properties: {
        bedrooms: { type: "integer", description: "Number of bedrooms (1-5)" },
        location: { type: "string", description: "City or region in Ghana", default: "Accra" },
        floorArea: { type: "number", description: "Total floor area in square meters" },
        floors: { type: "integer", description: "Number of floors", default: 1 },
        grade: { type: "string", enum: ["A", "B", "C"], description: "Finishing grade", default: "B" },
        addons: { type: "array", items: { type: "string" }, description: "pool, garden, security, solar" },
      },
      required: ["bedrooms"],
    },
    execute: async (args) => {
      const result = await executeTool("get_cost_estimate", args)
      return result.content.map((c) => c.text).join("\n")
    },
  },
  {
    name: "get_lead_score",
    description:
      "Score a prospect (by email) as cold/warm/hot based on their calculator usage, newsletter subscription, and orders. Use before recommending outreach.",
    parameters: {
      type: "object",
      properties: { email: { type: "string", description: "Prospect email" } },
      required: ["email"],
    },
    execute: async (args) => {
      const result = await executeTool("get_lead_score", { email: String(args.email ?? "") })
      return result.content.map((c) => c.text).join("\n")
    },
  },
  {
    name: "list_orders",
    description: "List recent orders, optionally filtered by status (pending, completed, failed).",
    parameters: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["pending", "completed", "failed"] },
        limit: { type: "integer", description: "Max results", default: 20 },
      },
    },
    execute: async (args) => {
      const result = await executeTool("list_orders", {
        status: args.status as string | undefined,
        limit: typeof args.limit === "number" ? args.limit : 20,
      })
      return result.content.map((c) => c.text).join("\n")
    },
  },
  {
    name: "list_blog_posts",
    description: "List published blog posts, optionally by category. Use for content planning.",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string" },
        limit: { type: "integer", default: 10 },
      },
    },
    execute: async (args) => {
      const result = await executeTool("list_blog_posts", {
        category: args.category as string | undefined,
        limit: typeof args.limit === "number" ? args.limit : 10,
      })
      return result.content.map((c) => c.text).join("\n")
    },
  },
  {
    name: "get_market_pricing",
    description: "Get current market pricing tiers and sales statistics per package.",
    parameters: {
      type: "object",
      properties: { currency: { type: "string", enum: ["GHS", "USD"], default: "USD" } },
    },
    execute: async (args) => {
      const result = await executeTool("get_market_pricing", { currency: String(args.currency ?? "USD") })
      return result.content.map((c) => c.text).join("\n")
    },
  },
  {
    name: "delegate_task",
    description:
      `Delegate a single task to a specialist subagent. Agents: ${SUBAGENT_KEYS.join(", ")}. ` +
      "SDR drafts outreach (never sends), Content plans copy, Pricing analyzes monetization, Research analyzes competitors, Ops handles operational checks. Use when the task is deep/specialist and needs a dedicated focus.",
    parameters: {
      type: "object",
      properties: {
        agent: { type: "string", enum: SUBAGENT_KEYS, description: "Which specialist subagent" },
        title: { type: "string", description: "Short task title for the audit log" },
        prompt: { type: "string", description: "Full task instructions for the subagent" },
      },
      required: ["agent", "title", "prompt"],
    },
    execute: async (args) => {
      const agent = String(args.agent ?? "")
      const spec = getSubagent(agent)
      if (!spec) return json({ error: `Unknown agent "${agent}". Available: ${SUBAGENT_KEYS.join(", ")}` })

      const title = String(args.title ?? "")
      const prompt = String(args.prompt ?? "")

      const task = await prisma.cofounderTask.create({
        data: {
          title,
          agent,
          status: "running",
          prompt,
          startedAt: new Date(),
        },
      })

      // Delegate = one focused LLM call with the subagent's system prompt.
      // Runs inline so the cofounder can report the result back immediately.
      let resultText: string
      let success = true
      try {
        const { runSubagent } = await import("@/lib/cofounder/agent")
        resultText = await runSubagent(spec, prompt)
      } catch (err) {
        success = false
        resultText = `Subagent failed: ${err instanceof Error ? err.message : String(err)}`
        await prisma.cofounderTask.update({
          where: { id: task.id },
          data: { status: "failed", error: resultText, completedAt: new Date() },
        })
        return json({ taskId: task.id, status: "failed", error: resultText })
      }

      await prisma.cofounderTask.update({
        where: { id: task.id },
        data: { status: success ? "completed" : "failed", result: resultText, completedAt: new Date() },
      })

      await logAgentAction({
        agent: "Cofounder",
        action: `delegate_${agent}`,
        entityType: "CofounderTask",
        entityId: task.id,
        level: success ? "success" : "error",
        details: { title, resultPreview: resultText.slice(0, 500) },
      })

      return json({ taskId: task.id, status: success ? "completed" : "failed", result: resultText.slice(0, 4000) })
    },
  },
]

export const cofounderToolMap = new Map(cofounderTools.map((t) => [t.name, t]))
