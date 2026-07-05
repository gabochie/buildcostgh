import { NextResponse } from "next/server"
import { isMaintenanceMode } from "@/lib/maintenance"

export async function GET() {
  const enabled = await isMaintenanceMode()
  return NextResponse.json({ enabled }, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  })
}
