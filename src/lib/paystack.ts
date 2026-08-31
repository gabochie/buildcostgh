const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || ""
const PAYSTACK_API = "https://api.paystack.co"

import { fetchJson } from "./http"

export async function initializePayment(params: {
  email: string
  amount: number
  reference: string
  metadata?: Record<string, unknown>
}) {
  if (!PAYSTACK_SECRET) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured")
  }

  return fetchJson(`${PAYSTACK_API}/transaction/initialize`, {
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

export async function verifyPayment(reference: string) {
  if (!PAYSTACK_SECRET) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured")
  }

  return fetchJson(`${PAYSTACK_API}/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
    },
  })
}
