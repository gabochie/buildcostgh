import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { enqueueJob, processJobQueue } from "@/lib/queue"
import { isAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session?.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()

  if (body.type === "process_queue") {
    const processed = await processJobQueue(20)
    return NextResponse.json({ processed })
  }

  const job = await enqueueJob(body.type, body.payload, body.scheduledAt ? new Date(body.scheduledAt) : undefined)
  return NextResponse.json({ job })
}
