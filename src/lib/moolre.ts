// Moolre — Ghana mobile-money / hosted checkout gateway.
// Docs: https://docs.moolre.com
// Hosted checkout: POST /embed/link  (returns data.authorization_url)
// Verification:   POST /open/transact/status

const MOOLRE_ENV = process.env.MOOLRE_ENV === "production" ? "production" : "sandbox"

const API_BASE =
  MOOLRE_ENV === "production" ? "https://api.moolre.com" : "https://sandbox.moolre.com"

const LINK_URL = `${API_BASE}/embed/link`
const STATUS_URL = `${API_BASE}/open/transact/status`

import { fetchWithTimeout } from "./http"

export const isMoolreConfigured = (): boolean =>
  Boolean(
    process.env.MOOLRE_ACCOUNT_NUMBER &&
      process.env.MOOLRE_API_USER &&
      // Public key is required for live payment initiation, optional in sandbox.
      (MOOLRE_ENV === "sandbox" || process.env.MOOLRE_PUBLIC_KEY)
  )

export interface MoolrePaymentRequest {
  reference: string
  email: string
  amount: number
  currency?: string
  callback?: string
  redirect?: string
  metadata?: Record<string, unknown>
}

export interface MoolrePaymentLinkResponse {
  status: number
  code?: string
  message?: string | string[] | null
  data?: {
    authorization_url?: string
    reference?: string
  } | []
}

/**
 * Create a hosted Moolre checkout page. The returned authorization_url is where
 * the customer is redirected to complete payment.
 */
export async function createPaymentLink(
  params: MoolrePaymentRequest
): Promise<MoolrePaymentLinkResponse> {
  if (!isMoolreConfigured()) {
    throw new Error("Moolre is not configured (MOOLRE_ACCOUNT_NUMBER / MOOLRE_API_USER missing)")
  }

  const body: Record<string, unknown> = {
    type: 1,
    amount: params.amount.toFixed(2),
    email: params.email,
    externalref: params.reference,
    currency: params.currency || "GHS",
    accountnumber: process.env.MOOLRE_ACCOUNT_NUMBER,
    reusable: "0",
    ...(params.callback ? { callback: params.callback } : {}),
    ...(params.redirect ? { redirect: params.redirect } : {}),
    ...(params.metadata ? { metadata: params.metadata } : {}),
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-API-USER": process.env.MOOLRE_API_USER || "",
  }
  if (process.env.MOOLRE_PUBLIC_KEY) headers["X-API-PUBKEY"] = process.env.MOOLRE_PUBLIC_KEY

  const response = await fetchWithTimeout(LINK_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Moolre link error ${response.status}: ${text}`)
  }

  return response.json()
}

export interface MoolreVerificationData {
  txstatus: number
  txtype?: number
  accountnumber?: string
  payer?: string
  payee?: string
  amount?: string
  value?: string
  transactionid?: string
  externalref?: string
  thirdpartyref?: string
  ts?: string
}

export interface MoolreVerificationResponse {
  status: number
  code?: string
  message?: string | string[] | null
  data?: MoolreVerificationData | []
}

/**
 * Verify a Moolre transaction by its external reference. Returns the raw Moolre
 * payload. Callers MUST validate txstatus === 1, that externalref matches the
 * local reference, and that amount/accountnumber match before fulfilling.
 */
export async function verifyTransaction(reference: string): Promise<MoolreVerificationResponse> {
  if (!isMoolreConfigured()) {
    throw new Error("Moolre is not configured (MOOLRE_ACCOUNT_NUMBER / MOOLRE_API_USER missing)")
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-API-USER": process.env.MOOLRE_API_USER || "",
  }
  if (process.env.MOOLRE_PUBLIC_KEY) headers["X-API-PUBKEY"] = process.env.MOOLRE_PUBLIC_KEY

  const response = await fetchWithTimeout(STATUS_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      type: 1,
      idtype: "1",
      id: reference,
      accountnumber: process.env.MOOLRE_ACCOUNT_NUMBER,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Moolre verify error ${response.status}: ${text}`)
  }

  return response.json()
}

/** True when the Moolre response indicates a successful payment for the given local reference/amount. */
export function isMoolreSuccess(
  res: MoolreVerificationResponse,
  opts: { reference: string; amount: number; accountNumber: string }
): boolean {
  const data = res.data
  if (!data || Array.isArray(data)) return false
  if (res.status !== 1 || Number(data.txstatus) !== 1) return false
  if (data.externalref !== opts.reference) return false
  if (data.accountnumber !== opts.accountNumber) return false
  if (Number(data.amount) !== opts.amount) return false
  return true
}
