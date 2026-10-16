import { NextRequest, NextResponse } from "next/server"
import { logAgentAction } from "@/lib/agent-log"
import { secureEqual } from "@/lib/secure-compare"
import { captureError } from "@/lib/observe"
import type { Prisma } from "@prisma/client"
import { z } from "zod"

export const dynamic = "force-dynamic"

/**
 * Agentic DevOps intake (Phase 1: log-only stub).
 *
 * Accepts signed event payloads from future Sentry/GitHub webhook sources,
 * records them to AgentLog, and acknowledges. It takes NO action — triage
 * runners and proposals arrive in Phase 2/3. Disabled entirely when
 * OPS_AGENT_ENABLED=false.
 *
 * Auth: Bearer OPS_AGENT_KEY (falls back to CRON_SECRET so existing
 * automation can call it without a new secret).
 */

const intakeSchema = z.object({
  source: z.enum(["sentry", "github", "vercel", "manual"]),
  title: z.string().min(1).max(500),
  fingerprint: z.string().max(200).optional(),
  url: z.string().max(2000).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
})

export async function POST(req: NextRequest) {
  if (process.env.OPS_AGENT_ENABLED === "false") {
    return NextResponse.json({ error: "Ops agent disabled" }, { status: 503 })
  }

  const authHeader = req.headers.get("authorization") || ""
  const token = authHeader.replace(/^Bearer\s+/i, "").trim()
  const secret = process.env.OPS_AGENT_KEY || process.env.CRON_SECRET
  if (!secret || !secureEqual(token, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = intakeSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "source and title are required" }, { status: 400 })
  }

  try {
    await logAgentAction({
      agent: "OpsAgent",
      action: "intake_received",
      entityType: "ops-event",
      entityId: parsed.data.fingerprint || undefined,
      level: "warning",
      details: {
        source: parsed.data.source,
        title: parsed.data.title,
        url: parsed.data.url || null,
        // Stored for Phase 2 triage; never executed.
        payload: (parsed.data.payload || {}) as Prisma.InputJsonObject,
      },
    })
  } catch (err) {
    await captureError(err, { scope: "ops-agent/intake" })
    return NextResponse.json({ error: "Failed to record event" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, acknowledged: true }, { status: 202 })
}
