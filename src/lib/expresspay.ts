const EXPRESSPAY_MERCHANT_ID = process.env.EXPRESSPAY_MERCHANT_ID || ""
const EXPRESSPAY_API_KEY = process.env.EXPRESSPAY_API_KEY || ""
const EXPRESSPAY_ENV = process.env.EXPRESSPAY_ENV === "production" ? "production" : "sandbox"

import { fetchJson } from "./http"

const BASE_URL =
  EXPRESSPAY_ENV === "production"
    ? "https://expresspaygh.com"
    : "https://sandbox.expresspaygh.com"

const SUBMIT_URL = `${BASE_URL}/api/submit.php`
const QUERY_URL = `${BASE_URL}/api/query.php`

export type ExpressPaySubmitResponse = {
  status: number
  "order-id"?: string
  token?: string
  message?: string
}

export type ExpressPayQueryResult = {
  result: number
  "result-text"?: string
  "order-id"?: string
  token?: string
  "transaction-id"?: string
  currency?: string
  amount?: number | string
  "date-processed"?: string
}

function postForm(url: string, fields: Record<string, string>) {
  const body = new URLSearchParams(fields)
  return fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
}

export async function submitPayment(params: {
  amount: number
  orderId: string
  orderDesc: string
  redirectUrl: string
  postUrl: string
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
}): Promise<ExpressPaySubmitResponse> {
  const fields: Record<string, string> = {
    "merchant-id": EXPRESSPAY_MERCHANT_ID,
    "api-key": EXPRESSPAY_API_KEY,
    currency: "GHS",
    amount: params.amount.toFixed(2),
    "order-id": params.orderId,
    "order-desc": params.orderDesc,
    "redirect-url": params.redirectUrl,
    "post-url": params.postUrl,
  }
  if (params.firstName) fields["firstname"] = params.firstName
  if (params.lastName) fields["lastname"] = params.lastName
  if (params.email) fields["email"] = params.email
  if (params.phoneNumber) fields["phonenumber"] = params.phoneNumber

  return postForm(SUBMIT_URL, fields)
}

export function getCheckoutUrl(token: string): string {
  return `${BASE_URL}/payment?token=${encodeURIComponent(token)}`
}

export async function queryPayment(token: string): Promise<ExpressPayQueryResult> {
  return postForm(QUERY_URL, {
    "merchant-id": EXPRESSPAY_MERCHANT_ID,
    "api-key": EXPRESSPAY_API_KEY,
    token,
  })
}
