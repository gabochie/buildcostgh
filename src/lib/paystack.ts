const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || ""
const PAYSTACK_API = "https://api.paystack.co"

import { fetchJson } from "./http"

export type PaystackInitializeResponse = {
  status: boolean
  message?: string
  data?: { authorization_url: string; access_code?: string; reference?: string }
}

export type PaystackTransaction = {
  id?: number
  status?: string
  reference?: string
  amount?: number
  currency?: string
  paid_at?: string
}

export type PaystackVerifyResponse = {
  status?: boolean
  message?: string
  data?: PaystackTransaction & { status?: string; amount?: number }
}

export async function initializePayment(params: {
  email: string
  amount: number
  reference: string
  metadata?: Record<string, unknown>
}): Promise<PaystackInitializeResponse> {
  if (!PAYSTACK_SECRET) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured")
  }

  return fetchJson<PaystackInitializeResponse>(`${PAYSTACK_API}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount * 100,
      reference: params.reference,
      metadata: params.metadata,
      currency: "GHS",
    }),
  })
}

export async function verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
  if (!PAYSTACK_SECRET) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured")
  }

  return fetchJson<PaystackVerifyResponse>(`${PAYSTACK_API}/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
    },
  })
}
