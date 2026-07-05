import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { enqueueJob, processJobQueue } from "@/lib/queue"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()

  if (body.type === "process_queue") {
    const processed = await processJobQueue(20)
    return NextResponse.json({ processed })
  }

  const job = await enqueueJob(body.type, body.payload, body.scheduledAt ? new Date(body.scheduledAt) : undefined)
  return NextResponse.json({ job })
}
