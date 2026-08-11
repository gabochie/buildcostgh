import type { Metadata } from "next"
import { EmailText } from "@/components/shared/SafeEmail"

export const metadata: Metadata = {
  title: "Cookie Policy - BuildCost GH",
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-heading font-bold text-charcoal mb-8">Cookie Policy</h1>
        <div className="prose prose-gray max-w-none space-y-6">
          <p>Last updated: {new Date().toLocaleDateString("en-GH", { year: "numeric", month: "long", day: "numeric" })}</p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">1. What Are Cookies</h2>
          <p>Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences, understand how you use the site, and improve your experience.</p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">2. Cookies We Use</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 border border-gray-200 font-semibold">Cookie</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Purpose</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Duration</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Type</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border border-gray-200">next-auth.session-token</td>
                  <td className="p-3 border border-gray-200">Maintains your login session</td>
                  <td className="p-3 border border-gray-200">Session</td>
                  <td className="p-3 border border-gray-200">Essential</td>
                </tr>
                <tr>
                  <td className="p-3 border border-gray-200">next-auth.csrf-token</td>
                  <td className="p-3 border border-gray-200">Protects against cross-site request forgery</td>
                  <td className="p-3 border border-gray-200">Session</td>
                  <td className="p-3 border border-gray-200">Essential</td>
                </tr>
                <tr>
                  <td className="p-3 border border-gray-200">next-auth.callback-url</td>
                  <td className="p-3 border border-gray-200">Redirects you after login</td>
                  <td className="p-3 border border-gray-200">Session</td>
                  <td className="p-3 border border-gray-200">Essential</td>
                </tr>
                <tr>
                  <td className="p-3 border border-gray-200">_ga, _gid, _gat</td>
                  <td className="p-3 border border-gray-200">Google Analytics — tracks page usage and site performance</td>
                  <td className="p-3 border border-gray-200">2 years, 24 hours, 1 minute</td>
                  <td className="p-3 border border-gray-200">Analytics</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">3. Essential Cookies</h2>
          <p>Essential cookies are required for the website to function properly. They enable core features like login, payment processing, and security. These cookies do not require your consent but are necessary for the service.</p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">4. Analytics Cookies</h2>
          <p>We use Google Analytics to understand how visitors interact with our website. This helps us improve the user experience. Analytics cookies collect anonymous data about pages visited, time spent, and interactions. You can opt out of these cookies.</p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">5. Third-Party Cookies</h2>
          <p>We use the following third-party services that may set cookies:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Paystack</strong> — payment processing (session cookies)</li>
            <li><strong>Google Analytics</strong> — usage tracking (analytics cookies)</li>
            <li><strong>YouTube</strong> — embedded videos (may set cookies when you play a video)</li>
          </ul>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">6. Managing Cookies</h2>
          <p>You can control and manage cookies in your browser settings. Most browsers allow you to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>View cookies stored on your device</li>
            <li>Block cookies from specific sites</li>
            <li>Delete all cookies</li>
            <li>Set preferences for cookie handling</li>
          </ul>
          <p>Disabling essential cookies may affect how the website functions. You can disable analytics cookies by opting out in our cookie banner or through your browser settings.</p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">7. Updates</h2>
          <p>We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated revision date.</p>

          <h2 className="text-xl font-heading font-bold text-charcoal mt-8">8. Contact</h2>
          <p>If you have questions about our use of cookies, contact us at <EmailText email="info@buildcostgh.com" /> or call +233 53 936 4716.</p>
        </div>
      </div>
    </div>
  )
}
