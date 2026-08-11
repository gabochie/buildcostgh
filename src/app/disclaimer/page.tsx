import type { Metadata } from "next"
import { EmailText } from "@/components/shared/SafeEmail"

export const metadata: Metadata = {
  title: "Disclaimer - BuildCost GH",
}

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-heading font-bold text-charcoal mb-8">Disclaimer</h1>
        <div className="prose prose-gray max-w-none space-y-6">
          <p>Last updated: {new Date().toLocaleDateString("en-GH", { year: "numeric", month: "long", day: "numeric" })}</p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">1. Estimates Are for Guidance Only</h2>
          <p>
            BuildCost GH provides construction cost estimates based on market data, supplier prices, and industry
            averages. These estimates are for <strong>informational and planning purposes only</strong>. Actual
            construction costs may vary significantly based on site conditions, contractor rates, material availability,
            location-specific factors, and market fluctuations.
          </p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">2. Not Professional Advice</h2>
          <p>
            The information provided by BuildCost GH does not constitute professional engineering, architectural,
            legal, or financial advice. You should always consult with licensed professionals before making
            decisions about construction projects, land purchases, or financial commitments.
          </p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">3. No Guarantee of Accuracy</h2>
          <p>
            While we strive to keep our data accurate and up to date, we make no representations or warranties
            of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or
            availability of the cost estimates provided. Use of our estimates is at your own risk.
          </p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">4. Third-Party Links</h2>
          <p>
            Our website may contain links to third-party websites, including contractor directories and
            supplier listings. We do not endorse, guarantee, or take responsibility for the quality of work
            or services provided by any third party listed on our platform. Always verify credentials and
            references before hiring contractors or engaging suppliers.
          </p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">5. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, BuildCost GH and its operators shall not be liable for any
            loss or damage, including without limitation, indirect or consequential loss or damage, arising
            from or in connection with the use of our cost estimates, reports, or website.
          </p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">6. Investment Decisions</h2>
          <p>
            Cost estimates provided by BuildCost GH should not be the sole basis for real estate investment
            decisions. Conduct thorough due diligence, including site visits, title searches, and
            consultations with local professionals, before making any investment.
          </p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">7. Changes to This Disclaimer</h2>
          <p>We may update this disclaimer from time to time. Changes will be posted on this page with an updated revision date.</p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">8. Contact</h2>
          <p>For questions about this disclaimer, contact us at <EmailText email="info@buildcostgh.com" /> or call +233 53 936 4716.</p>
        </div>
      </div>
    </div>
  )
}
