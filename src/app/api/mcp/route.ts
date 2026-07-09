import { NextRequest, NextResponse } from "next/server"
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"
import { prisma } from "@/lib/prisma"
import { toolDefinitions } from "@/lib/mcp/tools"
import { executeTool } from "@/lib/mcp/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const server = new Server(
  { name: "buildcostgh-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: toolDefinitions,
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const result = await executeTool(request.params.name, request.params.arguments ?? {})
  return result
})

const transports = new Map<string, SSEServerTransport>()

export async function GET(req: NextRequest) {
  const transport = new SSEServerTransport("/api/mcp", (await import("next/server")).NextResponse as any)

  const sessionId = transport.sessionId
  transports.set(sessionId, transport)

  req.signal.addEventListener("abort", () => {
    transports.delete(sessionId)
  })

  await server.connect(transport)

  return transport.response
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  const sessionId = url.searchParams.get("sessionId")

  if (!sessionId || !transports.has(sessionId)) {
    return NextResponse.json({ error: "No active session" }, { status: 400 })
  }

  const transport = transports.get(sessionId)!
  const body = await req.text()
  await transport.handlePostMessage(req as any, body as any)

  return new NextResponse("Accepted", { status: 202 })
}
