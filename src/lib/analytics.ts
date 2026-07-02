type EventName =
  | "calculator_started"
  | "calculator_step_completed"
  | "estimate_viewed"
  | "checkout_started"
  | "purchase_completed"
  | "email_captured"
  | "lead_magnet_downloaded"

export function trackEvent(event: EventName, data?: Record<string, unknown>) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    ;(window as any).gtag("event", event, data)
  }
  if (typeof window !== "undefined" && (window as any).fbq) {
    ;(window as any).fbq("track", event, data)
  }
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics]", event, data)
  }
}
