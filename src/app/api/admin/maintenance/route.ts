import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isMaintenanceMode, setMaintenanceMode } from "@/lib/maintenance"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const enabled = await isMaintenanceMode()
  return NextResponse.json({ enabled })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { enabled } = await req.json()
  await setMaintenanceMode(enabled)
  return NextResponse.json({ enabled })
}
