import { NextRequest, NextResponse } from "next/server"
import { generateReference } from "@/lib/utils"
import { prisma } from "@/lib/prisma"
import { validatePackageAmount } from "@/lib/pricing"
import { logAgentAction } from "@/lib/agent-log"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fullName, email, phone, packageName, amount, transactionRef, payerPhone, notes } = body

    if (!fullName || !email || !packageName || !amount || !transactionRef) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const serverAmount = await validatePackageAmount(String(packageName), Number(amount))
    if (serverAmount === null) {
      return NextResponse.json({ error: "Invalid package or amount" }, { status: 400 })
    }

    const reference = generateReference()

    const order = await prisma.order.create({
      data: {
        fullName,
        email,
        phone,
        package: packageName,
        amount: serverAmount,
        reference,
        status: "pending",
        metadata: {
          paymentMethod: "manual_momo",
          momoNumber: "+233 24 326 2019",
          supportNumber: "+233 53 936 4716",
          transactionRef,
          payerPhone: payerPhone || null,
          notes: notes || null,
        },
      },
    })

    await logAgentAction({
      agent: "PaymentBot",
      action: "manual_payment_submitted",
      entityType: "order",
      entityId: order.id,
      level: "info",
      details: { reference, package: packageName, amount: serverAmount, transactionRef },
    })

    return NextResponse.json({ reference, amount: serverAmount })
  } catch (error) {
    console.error("Manual order error:", error)
    return NextResponse.json({ error: "Failed to submit payment proof" }, { status: 500 })
  }
}
