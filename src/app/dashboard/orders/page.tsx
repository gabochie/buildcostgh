"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Download, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { GradientButton } from "@/components/shared"

type Order = {
  id: string
  package: string
  amount: number
  status: string
  reference: string
  reportUrl: string | null
  createdAt: string
}

export default function OrdersPage() {
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["user-orders"],
    queryFn: () => fetch("/api/user/orders").then((r) => r.json()),
    staleTime: 30_000,
    retry: 2,
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">My Orders</h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">You haven&apos;t purchased any reports yet.</p>
          <Link href="/pricing">
            <GradientButton>View Packages</GradientButton>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-gray-100 gap-4"
            >
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{order.package} Report</p>
                <p className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString("en-GH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-xs text-gray-400">Ref: {order.reference}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(order.amount)}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      order.status === "completed"
                        ? "bg-emerald-50 text-emerald-700"
                        : order.status === "pending"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                    }`}
                  >
                    {order.status === "completed" ? "Delivered" : order.status}
                  </span>
                </div>
                {order.status === "completed" && (
                  order.reportUrl ? (
                    <a
                      href={order.reportUrl}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <Download className="h-4 w-4" /> Download
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">Processing</span>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
