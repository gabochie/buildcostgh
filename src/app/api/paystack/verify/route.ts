import { NextRequest, NextResponse } from "next/server"
import { verifyPayment } from "@/lib/paystack"
import { prisma } from "@/lib/prisma"
import { sendReportReceipt } from "@/lib/email"

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get("reference")
    if (!reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 })
    }

    const response = await verifyPayment(reference)

    if (response.status && response.data.status === "success") {
      const order = await prisma.order.update({
        where: { reference },
        data: { status: "completed" },
      })

      try {
        await sendReportReceipt(order.email, order.fullName, order.package, order.reference)
      } catch (emailError) {
        console.error("Failed to send receipt email:", emailError)
      }

      return NextResponse.json({ status: "success", data: response.data })
    }

    await prisma.order.update({
      where: { reference },
      data: { status: "failed" },
    })

    return NextResponse.json({ status: "failed" })
  } catch (error) {
    console.error("Paystack verify error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
