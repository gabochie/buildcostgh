import { NextRequest, NextResponse } from "next/server"
import { toolDefinitions } from "@/lib/mcp/tools"
import { executeTool } from "@/lib/mcp/server"
import { auth } from "@/lib/auth"
import { authenticateApiKey, isAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * Tools that expose customer data or mutate business state.
 * These require an authenticated admin session — a valid API key is
 * not sufficient. Previously the whole endpoint was anonymous, letting
 * anyone dump the order database via `list_orders`.
 */
const ADMIN_ONLY_TOOLS = new Set([
  "create_order",
  "get_order_status",
  "get_lead_score",
  "list_orders",
  "trigger_report",
])

export async function GET() {
  return NextResponse.json({
    protocol: "2025-03-26",
    name: "buildcostgh-mcp",
    version: "1.0.0",
    capabilities: { tools: {} },
    tools: toolDefinitions,
    _links: {
      listTools: { method: "GET", path: "/api/mcp" },
      callTool: { method: "POST", path: "/api/mcp", body: { name: "tool_name", arguments: {} } },
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate BEFORE parsing the body: admin session or valid API key.
    const session = await auth()
    const isAdminUser = isAdmin(session?.user)

    if (!isAdminUser) {
      const apiAuth = await authenticateApiKey(req)
      if (!apiAuth.ok) {
        return NextResponse.json({ error: apiAuth.error }, { status: apiAuth.status })
      }
    }

    const body = await req.json()

    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "Missing tool name" }, { status: 400 })
    }

    if (ADMIN_ONLY_TOOLS.has(body.name) && !isAdminUser) {
      return NextResponse.json({ error: "This tool requires admin access" }, { status: 403 })
    }

    const result = await executeTool(body.name, body.arguments ?? {})

    return NextResponse.json({
      jsonrpc: "2.0",
      id: body.id || null,
      result: result.content,
      isError: result.isError,
    })
  } catch (err) {
    return NextResponse.json({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32603, message: err instanceof Error ? err.message : String(err) },
    }, { status: 500 })
  }
}
