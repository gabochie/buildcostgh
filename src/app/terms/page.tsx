import type { Metadata } from "next"
import { EmailText } from "@/components/shared/SafeEmail"

export const metadata: Metadata = {
  title: "Terms of Service - BuildCost GH",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-heading font-bold text-charcoal mb-8">Terms of Service</h1>
        <div className="prose prose-gray max-w-none space-y-6">
          <p>Last updated: {new Date().toLocaleDateString("en-GH", { year: "numeric", month: "long", day: "numeric" })}</p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">1. Acceptance of Terms</h2>
          <p>By using BuildCost GH, you agree to these terms of service. If you do not agree, please do not use our services.</p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">2. Service Description</h2>
          <p>BuildCost GH provides construction cost estimates and reports. Estimates are based on market data and should be used as guidelines. Actual costs may vary based on site conditions, material prices, and contractor rates.</p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">3. Payments and Refunds</h2>
          <p>All payments are processed through Paystack. We offer a 7-day money-back guarantee on all reports. See our full <a href="/refund" className="text-emerald-600 hover:text-emerald-700 underline">Refund Policy</a> for details.</p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">4. Intellectual Property</h2>
          <p>Reports and estimates provided are for personal use. You may not redistribute, resell, or reproduce our reports without permission.</p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">5. Limitation of Liability</h2>
          <p>BuildCost GH provides estimates for informational purposes. We are not liable for discrepancies between estimated and actual construction costs.</p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">6. Contact</h2>
          <p>For questions about these terms, contact us at <EmailText email="info@buildcostgh.com" /> or call +233 53 936 4716.</p>
        </div>
      </div>
    </div>
  )
}
