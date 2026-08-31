import { NextResponse } from "next/server"
import { getAvailableGateways } from "@/lib/gateways"

export const dynamic = "force-dynamic"

/**
 * Public list of enabled/configured payment gateways for the checkout UI.
 * Each entry's `kind` tells the client how to complete checkout:
 *   - "redirect" -> POST /api/payments/checkout and redirect to returned URL
 *   - "push"     -> POST /api/payments/momo/initialize (USSD prompt)
 *   - "manual"   -> show manual MoMo proof form
 * Cards (Paystack) are exposed separately by the UI since they use their own flow.
 */
export async function GET() {
  const gateways = getAvailableGateways().map((g) => ({
    id: g.id,
    name: g.name,
    shortName: g.shortName,
    description: g.description,
    icon: g.icon,
    kind: g.kind,
  }))

  // Card is served by its own Paystack flow; include it here for the selector.
  if (process.env.PAYSTACK_SECRET_KEY && !gateways.find((g) => g.id === "card")) {
    gateways.push({
      id: "card",
      name: "Card (Paystack)",
      shortName: "Card",
      description: "Pay online with Visa, Mastercard or other cards via Paystack.",
      icon: "CreditCard",
      kind: "redirect",
    })
  }

  return NextResponse.json({ gateways })
}
