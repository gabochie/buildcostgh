import { test, expect } from "@playwright/test"

// Regression guard for the Content-Security-Policy. These third-party origins
// must be permitted or the corresponding feature silently breaks in production:
//   - challenges.cloudflare.com  -> Cloudflare Turnstile captcha
//   - google-analytics.com / www.google.com / googletagmanager.com -> GA events
const REQUIRED_SCRIPT_SRC = ["https://challenges.cloudflare.com", "https://js.paystack.co"]
const REQUIRED_CONNECT_SRC = [
  "https://www.google-analytics.com",
  "https://analytics.google.com",
  "https://www.google.com",
  "https://*.googletagmanager.com",
  "https://api.paystack.co",
]
const REQUIRED_FRAME_SRC = ["https://challenges.cloudflare.com", "https://js.paystack.co"]

function parseDirective(csp: string, name: string): string[] {
  for (const part of csp.split(";")) {
    const trimmed = part.trim()
    if (trimmed.startsWith(name)) return trimmed.slice(name.length).trim().split(/\s+/)
  }
  return []
}

test.describe("content security policy", () => {
  test("allows Turnstile and analytics origins it depends on", async ({ request }) => {
    const res = await request.get("/")
    expect(res.status()).toBe(200)
    const csp = res.headers()["content-security-policy"] || ""
    expect(csp).toBeTruthy()

    for (const origin of REQUIRED_SCRIPT_SRC) {
      expect(parseDirective(csp, "script-src"), `script-src should allow ${origin}`).toContain(origin)
    }
    for (const origin of REQUIRED_CONNECT_SRC) {
      expect(parseDirective(csp, "connect-src"), `connect-src should allow ${origin}`).toContain(origin)
    }
    for (const origin of REQUIRED_FRAME_SRC) {
      expect(parseDirective(csp, "frame-src"), `frame-src should allow ${origin}`).toContain(origin)
    }

    // Security posture: a few directives must remain locked down.
    expect(parseDirective(csp, "default-src")).toContain("'self'")
    expect(parseDirective(csp, "frame-ancestors")).toEqual([]) // no frame embedding
  })
})
