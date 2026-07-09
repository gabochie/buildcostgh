import "server-only"
import { registerAllJobHandlers } from "./jobs"
import { validateEnv } from "./env"

let initialized = false

export function init() {
  if (initialized) return
  initialized = true

  validateEnv()
  registerAllJobHandlers()

  if (process.env.NODE_ENV === "development") {
    console.log("[BuildCost GH] Agents initialized: PaymentBot, ReportBot, LeadBot, PriceBot, SupportBot")
    console.log("[BuildCost GH] MCP Server: buildcostgh-mcp v1.0.0")
  }
}
