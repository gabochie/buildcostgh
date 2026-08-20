"use client"

import { formatCurrency } from "@/lib/utils"
import { Users } from "lucide-react"

export interface ProfessionalFeeItem {
  discipline: string
  amount: number
  percentage: number
}

interface ProfessionalFeesProps {
  fees: ProfessionalFeeItem[]
  total: number
  constructionCost: number
}

export function ProfessionalFees({ fees, total, constructionCost }: ProfessionalFeesProps) {
  if (!fees.length) return null

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
        <Users className="h-4 w-4 text-emerald-600" />
        Professional Service Fees
      </h3>
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-2 font-medium text-gray-600">Discipline</th>
              <th className="px-4 py-2 font-medium text-gray-600 text-right">Rate</th>
              <th className="px-4 py-2 font-medium text-gray-600 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((fee) => (
              <tr key={fee.discipline} className="border-t border-gray-100">
                <td className="px-4 py-2 text-gray-700">{fee.discipline}</td>
                <td className="px-4 py-2 text-gray-500 text-right">{fee.percentage.toFixed(1)}%</td>
                <td className="px-4 py-2 font-medium text-gray-900 text-right">{formatCurrency(fee.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t border-gray-200 font-bold">
              <td className="px-4 py-2 text-gray-900" colSpan={2}>Total Professional Fees</td>
              <td className="px-4 py-2 text-emerald-600 text-right">{formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-xs text-gray-400">
        Fees are indicative percentages of construction cost. Actual fees are subject to professional agreement.
      </p>
    </div>
  )
}
