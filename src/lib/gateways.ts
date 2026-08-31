import { isMoolreConfigured, createPaymentLink, verifyTransaction as verifyMoolre, isMoolreSuccess } from "@/lib/moolre"
import { submitPayment, getCheckoutUrl, queryPayment } from "@/lib/expresspay"
import { APP_URL, GatewayId, GatewayInitResult, GatewayVerifyOutput, GatewaySessionInput, PaymentGatewayConfig } from "@/lib/payments/types"

export const PAYMENT_GATEWAY = "PAYMENT_GATEWAY"

const GATEWAY_CONFIGS: Record<GatewayId, PaymentGatewayConfig> = {
  momo: {
    id: "momo",
    name: "MTN Mobile Money",
    shortName: "MTN MoMo",
    description: "Pay instantly via MTN MoMo USSD prompt to your phone.",
    icon: "Smartphone",
    kind: "push",
    isConfigured: () => Boolean(process.env.MOMO_API_USER && process.env.MOMO_API_KEY && process.env.MOMO_SUBSCRIPTION_KEY),
    hidden: false,
  },
  expresspay: {
    id: "expresspay",
    name: "ExpressPay",
    shortName: "ExpressPay",
    description: "ExpressPay hosted checkout — accepts Mobile Money, Ghana Pay, and cards.",
    icon: "Wallet",
    kind: "redirect",
    isConfigured: () => Boolean(process.env.EXPRESSPAY_MERCHANT_ID && process.env.EXPRESSPAY_API_KEY),
    hidden: false,
  },
  moolre: {
    id: "moolre",
    name: "Moolre",
    shortName: "Moolre",
    description: "Pay via Moolre hosted checkout (MTN, Telecel, AirtelTigo).",
    icon: "Landmark",
    kind: "redirect",
    isConfigured: () => isMoolreConfigured(),
    hidden: false,
  },
  card: {
    id: "card",
    name: "Card (Paystack)",
    shortName: "Card",
    description: "Pay online with Visa, Mastercard or other cards via Paystack.",
    icon: "CreditCard",
    kind: "redirect",
    isConfigured: () => Boolean(process.env.PAYSTACK_SECRET_KEY),
    hidden: false,
  },
  manual_momo: {
    id: "manual_momo",
    name: "Manual MoMo Transfer",
    shortName: "MoMo (Manual)",
    description: "Pay manually to our MoMo number and submit your proof of payment.",
    icon: "Receipt",
    kind: "manual",
    isConfigured: () => true,
    hidden: true,
  },
}

/** Gateways the operator explicitly enabled via PAYMENT_GATEWAYS (comma-separated). Empty = all configured. */
function enabledIds(): GatewayId[] | null {
  const raw = process.env.PAYMENT_GATEWAYS
  if (!raw) return null
  const ids = raw
    .split(",")
    .map((s) => s.trim().toLowerCase() as GatewayId)
    .filter((id) => id in GATEWAY_CONFIGS)
  return ids.length ? ids : null
}

export function getGateway(id: string | null | undefined): PaymentGatewayConfig | undefined {
  if (!id) return undefined
  return GATEWAY_CONFIGS[id as GatewayId]
}

/** Gateways available to show in the checkout UI (configured + not hidden). */
export function getAvailableGateways(): PaymentGatewayConfig[] {
  const enabled = enabledIds()
  return (Object.values(GATEWAY_CONFIGS) as PaymentGatewayConfig[])
    .filter((g) => !g.hidden)
    .filter((g) => g.isConfigured())
    .filter((g) => !enabled || enabled.includes(g.id))
}

/** Unified entry point to create a hosted payment session for any redirect gateway. */
export async function createGatewaySession(
  gateway: GatewayId,
  input: GatewaySessionInput
): Promise<GatewayInitResult> {
  const cfg = getGateway(gateway)
  if (!cfg) throw new Error(`Unknown payment gateway: ${gateway}`)
  if (!cfg.isConfigured()) throw new Error(`Payment gateway "${cfg.name}" is not configured`)

  switch (gateway) {
    case "expresspay": {
      const response = await submitPayment({
        amount: input.amount,
        orderId: input.reference,
        orderDesc: input.orderDesc,
        redirectUrl: input.redirectUrl || `${APP_URL}/api/payments/verify`,
        postUrl: input.postUrl || `${APP_URL}/api/payments/expresspay/post-url`,
        firstName: input.fullName,
        lastName: undefined,
        email: input.email,
        phoneNumber: input.phone,
      })
      if (response.status !== 1 || !response.token) {
        throw new Error(`ExpressPay failed to initialize: ${response.message || "no token"}`)
      }
      return {
        gateway,
        redirect: getCheckoutUrl(response.token),
        providerToken: response.token,
        reference: input.reference,
      }
    }

    case "moolre": {
      const link = await createPaymentLink({
        reference: input.reference,
        email: input.email,
        amount: input.amount,
        currency: "GHS",
        callback: `${APP_URL}/api/payments/moolre/callback`,
        redirect: input.redirectUrl || `${APP_URL}/api/payments/verify`,
        metadata: input.metadata || { orderDesc: input.orderDesc, fullName: input.fullName, phone: input.phone },
      })
      const url = link.data && !Array.isArray(link.data) ? link.data.authorization_url : undefined
      const ref = link.data && !Array.isArray(link.data) ? link.data.reference : undefined
      if (!url) {
        const msg = Array.isArray(link.message) ? link.message.join(", ") : link.message
        throw new Error(`Moolre failed to initialize: ${msg || link.code || "no authorization url"}`)
      }
      return {
        gateway,
        redirect: url,
        providerToken: ref || input.reference,
        reference: input.reference,
      }
    }

    case "card": {
      // Paystack initialize is handled by its own route (returns its own shape).
      throw new Error("Card gateway is handled by /api/paystack/initialize")
    }

    default:
      throw new Error(`Gateway "${gateway}" does not support hosted sessions`)
  }
}

/** Verify a redirect-gateway payment by its provider token/reference. Returns normalized status. */
export async function verifyGatewayPayment(
  gateway: GatewayId,
  token: string,
  opts: { expectedAmount?: number } = {}
): Promise<GatewayVerifyOutput> {
  switch (gateway) {
    case "expresspay": {
      const q = await queryPayment(token)
      if (q.result === 1) {
        if (opts.expectedAmount !== undefined && Number(q.amount) !== opts.expectedAmount) {
          return { status: "mismatch", provider: "expresspay", details: q }
        }
        return { status: "success", provider: "expresspay", transactionId: q["transaction-id"] || null, details: q }
      }
      if (q.result === 2 || q.result === 3) {
        return { status: "failed", provider: "expresspay", details: q }
      }
      return { status: "pending", provider: "expresspay", details: q }
    }

    case "moolre": {
      const v = await verifyMoolre(token)
      const account = process.env.MOOLRE_ACCOUNT_NUMBER || ""
      if (isMoolreSuccess(v, { reference: token, amount: opts.expectedAmount ?? NaN, accountNumber: account })) {
        const data = !Array.isArray(v.data) ? v.data : undefined
        return {
          status: "success",
          provider: "moolre",
          transactionId: data?.transactionid || null,
          details: v,
        }
      }
      const data = !Array.isArray(v.data) ? v.data : undefined
      if (v.status === 1 && data && Number(data.txstatus) === 1) {
        return { status: "mismatch", provider: "moolre", details: v }
      }
      if (data && (Number(data.txstatus) === 2 || Number(data.txstatus) === 3)) {
        return { status: "failed", provider: "moolre", details: v }
      }
      return { status: "pending", provider: "moolre", details: v }
    }

    default:
      throw new Error(`Gateway "${gateway}" does not support server-side verification here`)
  }
}
