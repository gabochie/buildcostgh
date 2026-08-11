import type { Metadata } from "next"
import { EmailText } from "@/components/shared/SafeEmail"

export const metadata: Metadata = {
  title: "Privacy Policy - BuildCost GH",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-heading font-bold text-charcoal mb-8">Privacy Policy</h1>
        <div className="prose prose-gray max-w-none space-y-6">
          <p>Last updated: {new Date().toLocaleDateString("en-GH", { year: "numeric", month: "long", day: "numeric" })}</p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">1. Information We Collect</h2>
          <p>We collect information you provide directly to us, including your name, email address, phone number, and project details when you use our calculator, purchase a report, or contact us.</p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">2. How We Use Your Information</h2>
          <p>We use your information to provide construction cost estimates, process payments, deliver reports, and improve our services. We do not sell your personal information to third parties.</p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">3. Payment Processing</h2>
          <p>Payments are processed securely through Paystack. We do not store your payment card details. Paystack&apos;s privacy policy applies to payment data.</p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">4. Cookies</h2>
          <p>We use cookies and similar technologies to enhance your experience, analyze site traffic, and maintain your session. For detailed information about the cookies we use, please see our <a href="/cookies" className="text-emerald-600 hover:text-emerald-700 underline">Cookie Policy</a>.</p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">5. Data Security</h2>
          <p>We implement appropriate security measures to protect your personal information. All data is transmitted over encrypted connections (SSL/TLS).</p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">6. Contact Us</h2>
          <p>If you have questions about this privacy policy, contact us at <EmailText email="info@buildcostgh.com" /> or call +233 53 936 4716.</p>
        </div>
      </div>
    </div>
  )
}
