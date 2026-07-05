import { NextRequest, NextResponse } from "next/server"
import { toolDefinitions } from "@/lib/mcp/tools"
import { executeTool } from "@/lib/mcp/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

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
    const body = await req.json()

    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "Missing tool name" }, { status: 400 })
    }

    const result = await executeTool(body.name, body.arguments ?? {})

    return NextResponse.json({
      jsonrpc: "2.0",
      id: body.id || null,
      result: result.content,
      isError: result.isError,
    })
  } catch (err: any) {
    return NextResponse.json({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32603, message: err?.message || "Internal error" },
    }, { status: 500 })
  }
}
