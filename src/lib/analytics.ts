type EventName =
  | "calculator_started"
  | "calculator_step_completed"
  | "estimate_viewed"
  | "checkout_started"
  | "purchase_completed"
  | "email_captured"
  | "lead_magnet_downloaded"

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
  }
}

export function trackEvent(event: EventName, data?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", event, data)
  }
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", event, data)
  }
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics]", event, data)
  }
}
