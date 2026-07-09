export function validateEnv(): boolean {
  const required = ["DATABASE_URL", "ADMIN_PASSWORD", "AUTH_SECRET"]
  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    if (process.env.NODE_ENV === "production") {
      console.error(`Missing required env vars: ${missing.join(", ")}`)
      throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
    }
    return false
  }
  return true
}
