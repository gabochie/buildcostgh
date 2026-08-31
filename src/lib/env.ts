export function validateEnv(): boolean {
  // Hard-required in every environment — without these the app cannot securely boot.
  const required = ["DATABASE_URL", "ADMIN_PASSWORD", "AUTH_SECRET", "ADMIN_EMAIL", "NEXT_PUBLIC_APP_URL"]

  // Secrets that gate real money / broadcasts. Warn (don't crash) when an
  // optional payment/email provider is configured in production but its key
  // is missing, so misconfiguration surfaces loudly instead of failing at
  // request time with a silent `|| ""`.
  const optionalSecrets: Array<[key: string, label: string]> = [
    ["PAYSTACK_SECRET_KEY", "Paystack"],
    ["RESEND_API_KEY", "Resend email"],
    ["MOMO_API_USER", "MTN MoMo"],
    ["MOMO_API_KEY", "MTN MoMo"],
    ["MOMO_SUBSCRIPTION_KEY", "MTN MoMo"],
    ["EXPRESSPAY_MERCHANT_ID", "ExpressPay"],
    ["EXPRESSPAY_API_KEY", "ExpressPay"],
    ["UPLOADTHING_SECRET", "Uploadthing"],
    ["TURNSTILE_SECRET", "Turnstile"],
  ]

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    if (process.env.NODE_ENV === "production") {
      console.error(`Missing required env vars: ${missing.join(", ")}`)
      throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
    }
    return false
  }

  if (process.env.NODE_ENV === "production") {
    for (const [key, label] of optionalSecrets) {
      if (!process.env[key]) {
        console.warn(`[env] ${label} provider key (${key}) is not set. ${label} features will be disabled.`)
      }
    }
  }

  return true
}
