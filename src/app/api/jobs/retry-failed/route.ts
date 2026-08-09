import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { retryFailedJobs } from "@/lib/queue"
import { isAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function POST() {
  const session = await auth()
  if (!isAdmin(session?.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const count = await retryFailedJobs()
  return NextResponse.json({ retried: count })
}
