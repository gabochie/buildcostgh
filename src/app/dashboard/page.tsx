"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ShoppingBag, User, ArrowRight, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

type Order = {
  id: string
  package: string
  amount: number
  status: string
  reference: string
  reportUrl: string | null
  createdAt: string
}

export default function DashboardOverview() {
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["user-orders"],
    queryFn: () => fetch("/api/user/orders").then((r) => r.json()),
    staleTime: 30_000,
    retry: 2,
  })

  const completedOrders = orders.filter((o) => o.status === "completed").length
  const totalSpent = orders.reduce((sum, o) => sum + (o.status === "completed" ? o.amount : 0), 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
          <p className="text-sm text-gray-500">Total Orders</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{completedOrders}</p>
          <p className="text-sm text-gray-500">Completed Orders</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <User className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
          <p className="text-sm text-gray-500">Total Spent</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No orders yet.</p>
            <Link href="/pricing" className="text-emerald-600 text-sm font-medium mt-2 inline-block hover:underline">
              Purchase a report to get started
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.package} Report</p>
                  <p className="text-xs text-gray-400">Ref: {order.reference}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(order.amount)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    order.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                    order.status === "pending" ? "bg-amber-50 text-amber-700" :
                    "bg-red-50 text-red-700"
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
