export type GatewayId =
  | "momo"
  | "expresspay"
  | "moolre"
  | "card"
  | "crypto"
  | "manual_momo"

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://buildcostgh.com"

export interface PaymentGatewayConfig {
  id: GatewayId
  name: string
  shortName: string
  description: string
  icon: string
  /** momo = USSD push; redirect = hosted checkout URL; manual = submit proof */
  kind: "push" | "redirect" | "manual"
  isConfigured: () => boolean
  hidden?: boolean
}

export interface GatewaySessionInput {
  reference: string
  amount: number
  currency?: string
  email: string
  phone?: string
  fullName?: string
  orderDesc: string
  redirectUrl?: string
  postUrl?: string
  metadata?: Record<string, unknown>
  /** USD reference price used by crypto gateways (Coinbase charges in USD). */
  localPriceUsd?: number
}

export interface GatewayInitResult {
  gateway: GatewayId
  /** Full URL to send the customer to for payment. */
  redirect?: string
  /** Opaque token returned by the provider (e.g. Moolre reference / ExpressPay token). */
  providerToken?: string
  reference: string
  message?: string
}

export interface GatewayVerifyOutput {
  status: "success" | "failed" | "pending" | "mismatch"
  provider: GatewayId
  transactionId?: string | null
  details?: unknown
}
