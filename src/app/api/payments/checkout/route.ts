import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { logAgentAction } from "@/lib/agent-log"
import { generateReference } from "@/lib/utils"
import { validatePackageAmount, validateSubscriptionAmount, getPackagePriceUsd, getSubscriptionPriceUsd } from "@/lib/pricing"
import { createGatewaySession, getGateway, getAvailableGateways } from "@/lib/gateways"
import { apiRateLimit } from "@/lib/rate-limit"
import { APP_URL, GatewayId } from "@/lib/payments/types"
import crypto from "crypto"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const rate = await apiRateLimit(request, { maxRequests: 20, path: "checkout" })
  if (!rate.ok && rate.response) return rate.response

  const idempotencyKey = request.headers.get("Idempotency-Key")
  if (!idempotencyKey) {
    return NextResponse.json({ error: "Missing Idempotency-Key header" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const {
      type = "package",
      gateway,
      fullName,
      email,
      phone,
      packageName,
      planSlug,
      amount,
      metadata,
    } = body

    if (!gateway) {
      return NextResponse.json({ error: "Missing payment gateway" }, { status: 400 })
    }
    const cfg = getGateway(String(gateway))
    if (!cfg || cfg.hidden) {
      return NextResponse.json({ error: "Unknown payment gateway" }, { status: 400 })
    }
    if (!cfg.isConfigured()) {
      return NextResponse.json({ error: `Payment gateway "${cfg.name}" is not configured` }, { status: 400 })
    }
    if (!getAvailableGateways().some((g) => g.id === cfg.id)) {
      return NextResponse.json({ error: `Payment gateway "${cfg.name}" is not enabled` }, { status: 400 })
    }

    const gid = String(gateway) as GatewayId
    if (gid === "momo") {
      // Direct MTN MoMo uses the dedicated USSD-push endpoint.
      return NextResponse.json(
        { error: "Use /api/payments/momo/initialize for direct MTN Mobile Money" },
        { status: 400 }
      )
    }
    if (gid === "card") {
      return NextResponse.json(
        { error: "Use /api/paystack/initialize for card payments" },
        { status: 400 }
      )
    }
    if (gid === "manual_momo") {
      return NextResponse.json(
        { error: "Use /api/orders/manual for manual MoMo proof submission" },
        { status: 400 }
      )
    }

    const session = await auth()
    const reference = generateReference()
    const referenceId = crypto.randomUUID()

    if (type === "package") {
      if (!fullName || !packageName || !amount) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
      }
      const serverAmount = await validatePackageAmount(String(packageName), Number(amount))
      if (serverAmount === null) {
        return NextResponse.json({ error: "Invalid package or amount" }, { status: 400 })
      }

      // Idempotency: a retried checkout with the same key must not create a
      // duplicate order (which could enable double-charging).
      const existing = await prisma.order.findUnique({ where: { idempotencyKey } })
      if (existing) {
        return NextResponse.json({ reference: existing.reference, duplicate: true, redirect: null })
      }

      const order = await prisma.order.create({
        data: {
          fullName,
          email: email || "",
          phone: phone || null,
          package: packageName,
          amount: serverAmount,
          reference,
          referenceId,
          paymentGateway: gid,
          metadata: metadata || {},
          status: "pending",
          idempotencyKey,
          userId: session?.user?.id ?? null,
        },
      })

      const inited = await createGatewaySession(gid, {
        reference,
        amount: serverAmount,
        email: email || "",
        phone,
        fullName,
        orderDesc: `${packageName} Report — BuildCost GH`,
        redirectUrl: `${APP_URL}/api/payments/verify`,
        postUrl: `${APP_URL}/api/payments/${gid}/post-url`,
        metadata: metadata || undefined,
        localPriceUsd: gid === "crypto" ? getPackagePriceUsd(String(packageName)) : undefined,
      })

      const providerToken = inited.providerToken
      if (providerToken) {
        await prisma.order.update({
          where: { id: order.id },
          data: { gatewayRef: providerToken },
        })
      }

      await logAgentAction({
        agent: "PaymentBot",
        action: `${gid}_checkout_initialized`,
        entityType: "order",
        entityId: order.id,
        level: "info",
        details: { reference, gateway: gid, amount: serverAmount },
      })

      return NextResponse.json({
        reference,
        redirect: inited.redirect,
        gateway: gid,
        message: inited.message,
      })
    }

    // --- subscription ---
    if (!fullName || !planSlug || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    const serverAmount = await validateSubscriptionAmount(String(planSlug), Number(amount))
    if (serverAmount === null) {
      return NextResponse.json({ error: "Invalid plan or amount" }, { status: 400 })
    }

    const plan = await prisma.plan.findUnique({ where: { slug: String(planSlug) } })
    if (!plan || !plan.active) {
      return NextResponse.json({ error: "Plan not found or inactive" }, { status: 404 })
    }

    const periodEnd = new Date()
    periodEnd.setMonth(
      periodEnd.getMonth() + (planSlug === "annual-unlimited" ? 12 : 1)
    )

    const sub = await prisma.subscription.create({
      data: {
        email,
        fullName,
        phone,
        planId: plan.id,
        status: "pending",
        reference,
        amount: serverAmount,
        currentPeriodEnd: periodEnd,
        paymentGateway: gid,
        idempotencyKey,
        userId: session?.user?.id ?? null,
      },
    })

    const inited = await createGatewaySession(gid, {
      reference,
      amount: serverAmount,
      email,
      phone,
      fullName,
      orderDesc: `${plan.name} — BuildCost GH`,
      redirectUrl: `${APP_URL}/api/payments/verify`,
      postUrl: `${APP_URL}/api/payments/${gid}/post-url`,
      metadata: metadata || undefined,
      localPriceUsd: gid === "crypto" ? getSubscriptionPriceUsd(String(planSlug)) : undefined,
    })

    const providerToken = inited.providerToken
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        gatewayRef: providerToken || null,
        ...(gid === "expresspay" ? { expresspayToken: providerToken || null } : {}),
      },
    })

    await logAgentAction({
      agent: "PaymentBot",
      action: `${gid}_checkout_initialized`,
      entityType: "subscription",
      entityId: sub.id,
      level: "info",
      details: { reference, gateway: gid, amount: serverAmount },
    })

    return NextResponse.json({
      reference,
      redirect: inited.redirect,
      gateway: gid,
      message: inited.message,
    })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment initialization failed" },
      { status: 500 }
    )
  }
}
