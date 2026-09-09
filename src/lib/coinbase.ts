import { fetchJson } from "./http"

const COINBASE_API_KEY = process.env.COINBASE_COMMERCE_API_KEY || ""
const COINBASE_API = "https://api.commerce.coinbase.com"
const COINBASE_VERSION = "2018-03-22"

export function isCoinbaseConfigured(): boolean {
  return Boolean(COINBASE_API_KEY && process.env.COINBASE_COMMERCE_WEBHOOK_SECRET)
}

function coinbaseHeaders(): Record<string, string> {
  return {
    "X-CC-Api-Key": COINBASE_API_KEY,
    "X-CC-Version": COINBASE_VERSION,
    "Content-Type": "application/json",
    Accept: "application/json",
  }
}

interface CoinbaseCharge {
  id: string
  code: string
  name?: string
  description?: string
  hosted_url: string
  local_price?: { amount: string; currency: string }
  pricing?: { local?: { amount: string; currency: string } }
  metadata?: Record<string, unknown> | null
  timeline?: { status: string; time?: string }[]
  payments?: {
    network?: string
    transaction_id?: string
    status?: string
    value?: { crypto?: { amount?: string; currency?: string } }
  }[]
}

interface CoinbaseChargeResponse {
  data?: CoinbaseCharge
  error?: { type?: string; message?: string }
}

export interface CoinbaseChargeResult {
  status: "success" | "failed" | "pending"
  transactionId?: string | null
  network?: string | null
  localAmount?: number
  localCurrency?: string
}

/** Fixed-price USD charge hosted on the Coinbase Commerce checkout. */
export async function createCoinbaseCharge(params: {
  reference: string
  name: string
  description: string
  localPriceUsd: number
  redirectUrl: string
  cancelUrl: string
  metadata?: Record<string, unknown>
}): Promise<{ chargeId: string; code: string; hostedUrl: string }> {
  if (!COINBASE_API_KEY) {
    throw new Error("COINBASE_COMMERCE_API_KEY is not configured")
  }

  const res = await fetchJson<CoinbaseChargeResponse>(`${COINBASE_API}/charges`, {
    method: "POST",
    headers: coinbaseHeaders(),
    body: JSON.stringify({
      name: params.name,
      description: params.description,
      pricing_type: "fixed_price",
      local_price: { amount: String(params.localPriceUsd), currency: "USD" },
      redirect_url: params.redirectUrl,
      cancel_url: params.cancelUrl,
      metadata: { ...(params.metadata || {}), reference: params.reference },
    }),
  })

  const data = res.data
  if (!data || !data.code || !data.hosted_url) {
    const msg = res.error?.message || "no charge data returned"
    throw new Error(`Coinbase Commerce failed to create charge: ${msg}`)
  }
  return { chargeId: data.id, code: data.code, hostedUrl: data.hosted_url }
}

/**
 * Poll the charge and normalize to our status vocabulary. `code` (hosted
 * checkout code) or the charge UUID both work.
 */
export async function getCoinbaseCharge(code: string): Promise<CoinbaseChargeResult> {
  if (!COINBASE_API_KEY) {
    throw new Error("COINBASE_COMMERCE_API_KEY is not configured")
  }
  const res = await fetchJson<CoinbaseChargeResponse>(`${COINBASE_API}/charges/${code}`, {
    headers: coinbaseHeaders(),
  })
  const data = res.data
  if (!data) return { status: "pending" }

  const statuses = (data.timeline || []).map((t) => t.status)
  const payment = data.payments?.[0]
  const local = data.pricing?.local || data.local_price

  if (statuses.includes("COMPLETED")) {
    return {
      status: "success",
      transactionId: payment?.transaction_id || null,
      network: payment?.network || null,
      localAmount: local ? Number(local.amount) : undefined,
      localCurrency: local?.currency,
    }
  }

  const failedStatuses = ["RESOLVED", "CANCELED", "EXPIRED", "UNRESOLVED", "CANCELED_BY_MERCHANT"]
  if (statuses.some((s) => failedStatuses.includes(s))) {
    return { status: "failed", localAmount: local ? Number(local.amount) : undefined, localCurrency: local?.currency }
  }

  return { status: "pending", localAmount: local ? Number(local.amount) : undefined, localCurrency: local?.currency }
}