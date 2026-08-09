import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api-auth"
import { checkRateLimit } from "@/lib/rate-limit"
import { ensureGoal, computeGoalProgress, recentTasks } from "@/lib/cofounder/goal"
import { runCofounderChat, openAiConfigured } from "@/lib/cofounder/agent"
import { logAgentAction } from "@/lib/agent-log"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * AI Cofounder endpoint (admin only).
 *
 * GET  → goal state + progress + recent delegated tasks (dashboard data).
 * POST → SSE chat stream: {activity|delta|tool_start|tool_end|done|error}
 *        over text/event-stream, driven by the OpenAI agent loop.
 */

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  )
}

async function requireAdmin(req: NextRequest): Promise<{ ok: true } | { ok: false; status: number; body: string }> {
  const session = await auth()
  if (!isAdmin(session?.user)) {
    return { ok: false, status: 401, body: JSON.stringify({ error: "Unauthorized" }) }
  }

  const rate = await checkRateLimit(getIp(req), { maxAttempts: 60, windowMs: 15 * 60 * 1000, useDb: false })
  if (!rate.allowed) {
    return { ok: false, status: 429, body: JSON.stringify({ error: rate.message ?? "Too many requests" }) }
  }

  return { ok: true }
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin.ok) {
    return new Response(admin.body, { status: admin.status, headers: { "Content-Type": "application/json" } })
  }

  const [goal, progress, tasks] = await Promise.all([
    ensureGoal(),
    ensureGoal().then(computeGoalProgress),
    recentTasks(20),
  ])

  return Response.json({
    goal: {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      targetAmount: goal.targetAmount,
      currency: goal.currency,
      periodStart: goal.periodStart,
      periodEnd: goal.periodEnd,
    },
    progress,
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      agent: t.agent,
      status: t.status,
      prompt: t.prompt,
      result: t.result,
      error: t.error,
      createdAt: t.createdAt,
    })),
    openAiConfigured: openAiConfigured(),
  })
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin.ok) {
    return new Response(admin.body, { status: admin.status, headers: { "Content-Type": "application/json" } })
  }

  if (!openAiConfigured()) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY is not configured. Add it to deploy the cofounder." }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    })
  }

  let body: { message?: string; history?: Array<{ role: "user" | "assistant"; content: string }> }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: { "Content-Type": "application/json" } })
  }

  const message = (body.message ?? "").trim()
  if (!message) {
    return new Response(JSON.stringify({ error: "message is required" }), { status: 400, headers: { "Content-Type": "application/json" } })
  }

  const history = (body.history ?? []).slice(-20).map((h) => ({
    role: h.role === "assistant" ? ("assistant" as const) : ("user" as const),
    content: String(h.content).slice(0, 8000),
  }))

  await logAgentAction({
    agent: "Cofounder",
    action: "chat_turn",
    level: "info",
    details: { message: message.slice(0, 500) },
  })

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      try {
        await runCofounderChat({
          messages: [...history, { role: "user", content: message }],
          emit: (e) => {
            switch (e.type) {
              case "activity":
                send("activity", { message: e.message })
                break
              case "delta":
                send("delta", { text: e.text })
                break
              case "tool_start":
                send("tool_start", { name: e.name, args: e.args })
                break
              case "tool_end":
                send("tool_end", { name: e.name, ok: e.ok, result: e.result.slice(0, 2000) })
                break
              case "done":
                send("done", { text: e.text })
                break
              case "error":
                send("error", { message: e.message })
                break
            }
          },
        })
      } catch (err) {
        await logAgentAction({
          agent: "Cofounder",
          action: "chat_error",
          level: "error",
          details: { error: err instanceof Error ? err.message : String(err) },
        })
        send("error", { message: err instanceof Error ? err.message : "Cofounder agent failed" })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
