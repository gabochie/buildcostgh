import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Refund Policy - BuildCost GH",
}

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-heading font-bold text-charcoal mb-8">Refund Policy</h1>
        <div className="prose prose-gray max-w-none space-y-6">
          <p>Last updated: {new Date().toLocaleDateString("en-GH", { year: "numeric", month: "long", day: "numeric" })}</p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">1. Our Guarantee</h2>
          <p>We stand behind the quality of our construction cost reports. If you are not satisfied with your purchase for any reason, we offer a <strong>7-day money-back guarantee</strong> from the date of purchase.</p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">2. Eligibility</h2>
          <p>To be eligible for a refund:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>You must request the refund within 7 days of purchase</li>
            <li>The request must come from the email address used for the purchase</li>
            <li>You must provide your order number (sent in your confirmation email)</li>
          </ul>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">3. How to Request a Refund</h2>
          <p>Contact us through any of the following channels:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Email: info@buildcostgh.com &mdash; include your order number and reason for refund</li>
            <li>Phone: +233 53 936 4716</li>
            <li>WhatsApp: +233 53 936 4716</li>
            <li>Contact form: Visit our <a href="/contact" className="text-emerald-600 hover:text-emerald-700 underline">contact page</a></li>
          </ul>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">4. Processing Time</h2>
          <p>Refunds are processed within 3-5 business days of approval. The refund will be issued to the original payment method used at the time of purchase. You will receive a confirmation email once the refund has been processed.</p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">5. Non-Refundable Items</h2>
          <p>The following are not eligible for a refund:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Consultation calls that have already taken place</li>
            <li>Project monitoring services that have already commenced</li>
            <li>Reports purchased more than 7 days ago</li>
          </ul>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">6. Disputes</h2>
          <p>If you believe a refund is warranted beyond the 7-day period (e.g., duplicate charge, technical error), please contact us and we will review your case individually.</p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">7. Changes to This Policy</h2>
          <p>We reserve the right to update this Refund Policy at any time. Changes will be posted on this page with an updated revision date.</p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">8. Contact</h2>
          <p>For refund-related questions, contact us at info@buildcostgh.com or call +233 53 936 4716.</p>
        </div>
      </div>
    </div>
  )
}
