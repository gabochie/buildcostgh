import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { retryFailedJobs } from "@/lib/queue"

export const dynamic = "force-dynamic"

export async function POST() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const count = await retryFailedJobs()
  return NextResponse.json({ retried: count })
}
