import webpush from "web-push"

let configured = false

function ensureConfigured() {
  if (configured) return true
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || "mailto:hello@buildcostgh.com"
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
  return true
}

export function isPushConfigured() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY
  return Boolean(publicKey && process.env.VAPID_PRIVATE_KEY)
}

export interface PushPayload {
  title: string
  body: string
  url?: string
}

export async function sendPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: PushPayload,
): Promise<{ ok: boolean; gone?: boolean; error?: string }> {
  if (!ensureConfigured()) return { ok: false, error: "Web Push not configured" }
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    return { ok: true }
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode
    if (statusCode === 404 || statusCode === 410) return { ok: false, gone: true }
    return { ok: false, error: err instanceof Error ? err.message : "Push failed" }
  }
}
