const MOMO_API_USER = process.env.MOMO_API_USER || ""
const MOMO_API_KEY = process.env.MOMO_API_KEY || ""
const MOMO_ENVIRONMENT = process.env.MOMO_ENVIRONMENT || "sandbox"
const MOMO_CALLBACK_URL = process.env.MOMO_CALLBACK_URL || ""

import crypto from "crypto"

const BASE_URL =
  MOMO_ENVIRONMENT === "production"
    ? "https://proxy.momoapi.mtn.com"
    : "https://sandbox.momodeveloper.mtn.com"

let cachedToken: { token: string; expiresAt: number } | null = null

export async function getMomoAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token
  }

  const credentials = Buffer.from(`${MOMO_API_USER}:${MOMO_API_KEY}`).toString("base64")

  const response = await fetch(`${BASE_URL}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Ocp-Apim-Subscription-Key": process.env.MOMO_SUBSCRIPTION_KEY || "",
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`MoMo token error ${response.status}: ${text}`)
  }

  const data = await response.json()
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }

  return cachedToken.token
}

export async function requestToPay(params: {
  referenceId: string
  amount: string
  currency: string
  phone: string
  payerMessage: string
  payeeNote: string
}) {
  const token = await getMomoAccessToken()

  const response = await fetch(`${BASE_URL}/v1_0/requesttopay`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Reference-Id": params.referenceId,
      "X-Target-Environment": process.env.MOMO_TARGET_ENVIRONMENT || "sandbox",
      "Ocp-Apim-Subscription-Key": process.env.MOMO_SUBSCRIPTION_KEY || "",
      "Content-Type": "application/json",
      ...(MOMO_CALLBACK_URL ? { "X-Callback-Url": MOMO_CALLBACK_URL } : {}),
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency,
      externalId: params.referenceId,
      payer: {
        partyIdType: "MSISDN",
        partyId: params.phone,
      },
      payerMessage: params.payerMessage,
      payeeNote: params.payeeNote,
    }),
  })

  if (!response.ok && response.status !== 202) {
    const text = await response.text()
    throw new Error(`MoMo requestToPay error ${response.status}: ${text}`)
  }

  return { referenceId: params.referenceId }
}

export async function getPaymentStatus(referenceId: string) {
  const token = await getMomoAccessToken()

  const response = await fetch(`${BASE_URL}/v1_0/requesttopay/${referenceId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Target-Environment": process.env.MOMO_TARGET_ENVIRONMENT || "sandbox",
      "Ocp-Apim-Subscription-Key": process.env.MOMO_SUBSCRIPTION_KEY || "",
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`MoMo getPaymentStatus error ${response.status}: ${text}`)
  }

  return response.json()
}

export function generateMomoReference(): string {
  return crypto.randomUUID()
}
