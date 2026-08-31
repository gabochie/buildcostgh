import { prisma } from "./prisma"
import { logAgentAction } from "./agent-log"

/**
 * A subscription grants paid access for the quoted period. This helper is the
 * single source of truth for "is this subscription currently entitling the
 * holder to paid features". Every subscription-gated route should use it
 * rather than trusting the raw status field, which may be stale (e.g. an
 * "active" record whose currentPeriodEnd has passed before the nightly cron
 * runs).
 */
export async function isSubscriptionActive(subscriptionId: string | null | undefined): Promise<boolean> {
  if (!subscriptionId) return false
  const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } })
  return (
    !!sub &&
    sub.status === "active" &&
    sub.currentPeriodEnd.getTime() > Date.now()
  )
}

/**
 * Nightly subscription maintenance:
 *  - Any subscription still marked "active" but whose period has ended is
 *    flipped to "expired" so downstream gating and reporting are accurate.
 *  - Subscriptions that the user chose NOT to cancel (cancelAtPeriodEnd =
 *    false) get a renewal reminder. Actual re-billing via ExpressPay/Paystack
 *    is not performed automatically — that is a provider-specific concern the
 *    operator can wire up once a recurring mandate exists.
 *
 * Returns the number of subscriptions expired.
 */
export async function processExpiredSubscriptions(): Promise<{ expired: number; reminded: number }> {
  const now = new Date()

  const expired = await prisma.subscription.findMany({
    where: { status: "active", currentPeriodEnd: { lt: now } },
  })

  let expiredCount = 0
  let remindedCount = 0

  for (const sub of expired) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "expired", canceledAt: sub.canceledAt ?? now },
    })
    expiredCount++

    await logAgentAction({
      agent: "PaymentBot",
      action: "subscription_expired",
      entityType: "subscription",
      entityId: sub.id,
      level: "info",
      details: { reference: sub.reference, email: sub.email },
    })

    // Renewal nudge for anyone who didn't cancel. Only if email is configured.
    if (!sub.cancelAtPeriodEnd && process.env.RESEND_API_KEY) {
      try {
        await sendRenewalReminder(sub.email, sub.reference)
        remindedCount++
      } catch (err) {
        await logAgentAction({
          agent: "PaymentBot",
          action: "subscription_renewal_reminder_failed",
          entityType: "subscription",
          entityId: sub.id,
          level: "warning",
          details: { reference: sub.reference, error: err instanceof Error ? err.message : String(err) },
        })
      }
    }
  }

  return { expired: expiredCount, reminded: remindedCount }
}

async function sendRenewalReminder(email: string, reference: string): Promise<void> {
  const domain = process.env.NEXT_PUBLIC_APP_URL || "https://buildcostgh.com"
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "BuildCost GH <billing@buildcostgh.com>",
      to: email,
      subject: "Your BuildCost GH subscription has expired",
      html: `
        <h2>Your BuildCost GH subscription has ended</h2>
        <p>Your subscription (<strong>${reference}</strong>) has expired.</p>
        <p>Renew for unlimited estimates and tools:</p>
        <p><a href="${domain}/pricing" style="display:inline-block;padding:12px 24px;background:#059669;color:white;border-radius:8px;text-decoration:none;">Renew Now</a></p>
        <hr>
        <p style="color:#6b7280;font-size:12px;">BuildCost GH — buildcostgh.com</p>
      `,
    }),
  })
  if (!res.ok) {
    throw new Error(`Resend returned ${res.status}: ${await res.text()}`)
  }
}
