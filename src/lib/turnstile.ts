const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET

export async function verifyTurnstileToken(token: string, remoteip?: string): Promise<boolean> {
  if (!TURNSTILE_SECRET) return true // skip verification if not configured

  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: TURNSTILE_SECRET,
        response: token,
        ...(remoteip ? { remoteip } : {}),
      }),
    })
    const result = await r.json()
    return result.success === true
  } catch {
    return false
  }
}
