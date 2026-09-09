import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logAgentAction } from "@/lib/agent-log"
import { enqueueJob } from "@/lib/queue"
import { generateReportForOrder, sendReceiptForOrder } from "@/lib/jobs"
import { verifyHmacSignature } from "@/lib/secure-compare"
import { getPackagePriceUsd, getSubscriptionPriceUsd } from "@/lib/pricing"

const COINBASE_WEBHOOK_SECRET = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET || ""

export const dynamic = "force-dynamic"

const EMPTY_METADATA: Record<string, unknown> = {}

function matchesExpected(localAmount: number | undefined, expectedUsd: number | undefined): boolean {
  if (expectedUsd === undefined || expectedUsd <= 0) return true
  if (localAmount === undefined || Number.isNaN(localAmount)) return false
  const diff = Math.abs(localAmount - expectedUsd) / expectedUsd
  return diff <= 0.02
}

interface CoinbaseEvent {
  event?: {
    type?: string
    data?: {
      code?: string
      metadata?: Record<string, unknown> | null
      pricing?: { local?: { amount?: string; currency?: string } }
      payments?: { network?: string; transaction_id?: string }[]
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get("x-cc-webhook-signature")

    // Coinbase Commerce webhooks sign the RAW request body with the webhook
    // shared secret (sha256, hex). Never trust an unauthenticated callback —
    // unlike Paystack there is no message to replay-proof on top.
    if (!verifyHmacSignature(COINBASE_WEBHOOK_SECRET, body, signature, "sha256")) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const payload: CoinbaseEvent = JSON.parse(body)
    const event = payload.event
    if (!event?.data) {
      return NextResponse.json({ received: true })
    }

    const chargeCode = event.data.code || ""
    const eventType = event.type || ""

    const order = chargeCode
      ? await prisma.order.findUnique({ where: { gatewayRef: chargeCode } })
      : null
    const subscription = chargeCode
      ? await prisma.subscription.findFirst({
          where: { gatewayRef: chargeCode },
          include: { plan: true },
        })
      : null

    if (!order && !subscription) {
      await logAgentAction({
        agent: "PaymentBot",
        action: "crypto_webhook_order_not_found",
        entityType: "order",
        entityId: chargeCode ||
          String(
            typeof event.data.metadata?.reference === "string"
              ? event.data.metadata.reference
              : ""
          ),
        level: "error",
        details: { event: eventType, chargeCode },
      })
      return NextResponse.json({ received: true })
    }

    if (eventType === "charge:confirmed") {
      const local = event.data.pricing?.local
      const localAmount = local?.amount ? Number(local.amount) : undefined
      const expectedUsd = order
        ? getPackagePriceUsd(order.package) || undefined
        : subscription
          ? getSubscriptionPriceUsd(subscription.plan.slug) || undefined
          : undefined

      if (!matchesExpected(localAmount, expectedUsd)) {
        await logAgentAction({
          agent: "PaymentBot",
          action: "crypto_webhook_amount_mismatch",
          entityType: order ? "order" : "subscription",
          entityId: (order?.id || subscription?.id) as string,
          level: "error",
          details: { chargeCode, expectedUsd, received: localAmount },
        })
        return NextResponse.json({ error: "Amount mismatch" }, { status: 400 })
      }

      const payment = event.data.payments?.[0]
      const txHash = payment?.transaction_id
      const network = payment?.network

      if (order) {
        const meta = (order.metadata as Record<string, unknown> | null) || EMPTY_METADATA
        const transition = await prisma.order.updateMany({
          where: { id: order.id, status: "pending" },
          data: {
            status: "completed",
            transactionId: txHash || order.transactionId,
            metadata: { ...meta, cryptoTxHash: txHash, cryptoNetwork: network },
          },
        })
        if (transition.count > 0) {
          await logAgentAction({
            agent: "PaymentBot",
            action: "crypto_payment_confirmed",
            entityType: "order",
            entityId: order.id,
            level: "success",
            details: { reference: order.reference, chargeCode, txHash, network, amountUsd: localAmount },
          })
          try { await generateReportForOrder(order.id) } catch {
            await enqueueJob("generate_report", { orderId: order.id })
          }
          try { await sendReceiptForOrder(order.id) } catch {
            await enqueueJob("send_receipt", { orderId: order.id })
          }
        }
      } else if (subscription) {
        const transition = await prisma.subscription.updateMany({
          where: { id: subscription.id, status: "pending" },
          data: {
            status: "active",
            transactionId: txHash || subscription.transactionId,
          },
        })
        if (transition.count > 0) {
          await logAgentAction({
            agent: "PaymentBot",
            action: "crypto_subscription_activated",
            entityType: "subscription",
            entityId: subscription.id,
            level: "success",
            details: { reference: subscription.reference, chargeCode, txHash, network },
          })
        }
      }

      return NextResponse.json({ received: true })
    }

    if (["charge:failed", "charge:cancelled", "charge:expired"].includes(eventType)) {
      if (order) {
        await prisma.order.updateMany({ where: { id: order.id }, data: { status: "failed" } })
      } else if (subscription) {
        await prisma.subscription.updateMany({ where: { id: subscription.id }, data: { status: "failed" } })
      }
      await logAgentAction({
        agent: "PaymentBot",
        action: "crypto_payment_failed",
        entityType: order ? "order" : "subscription",
        entityId: (order?.id || subscription?.id) as string,
        level: "warning",
        details: { event: eventType, chargeCode },
      })
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("Coinbase webhook error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}