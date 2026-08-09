"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { BookOpen, Code, Key, Shield, BarChart3, Copy, Check, ChevronRight } from "lucide-react"

const snippets = [
  {
    lang: "cURL",
    code: `curl -X POST https://buildcostgh.com/api/v1/estimate \\
  -H "Authorization: Bearer bc_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "bedrooms": 3,
    "location": "Accra",
    "finishGrade": "standard"
  }'`,
  },
  {
    lang: "JavaScript",
    code: `const res = await fetch("https://buildcostgh.com/api/v1/estimate", {
  method: "POST",
  headers: {
    Authorization: "Bearer bc_YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    bedrooms: 3,
    location: "Accra",
    finishGrade: "standard",
  }),
})
const data = await res.json()
console.log(data.estimate)`,
  },
  {
    lang: "Python",
    code: `import requests

res = requests.post(
    "https://buildcostgh.com/api/v1/estimate",
    headers={"Authorization": "Bearer bc_YOUR_API_KEY"},
    json={"bedrooms": 3, "location": "Accra", "finishGrade": "standard"},
)
print(res.json()["estimate"])`,
  },
]

export default function ApiDocsPage() {
  const [copied, setCopied] = useState<string | null>(null)
  const [keyInput, setKeyInput] = useState("")

  const copyCode = (code: string, lang: string) => {
    navigator.clipboard.writeText(code)
    setCopied(lang)
    setTimeout(() => setCopied(null), 2000)
  }

  const insertKey = (code: string) => code.replace("bc_YOUR_API_KEY", keyInput || "bc_YOUR_API_KEY")

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-charcoal py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Code className="h-6 w-6 text-emerald-400" />
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-white">API <span className="text-gradient-gold">Documentation</span></h1>
          </div>
          <p className="text-emerald-100/70 max-w-xl mx-auto">Integrate real-time Ghana construction cost estimates into your platform</p>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-7 relative z-10 pb-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-glass">
              <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-emerald-600" /> POST /api/v1/estimate</h2>
              <p className="text-sm text-gray-600 mb-4">Get a construction cost estimate based on bedrooms, location, and finish grade.</p>

              <h3 className="font-semibold text-gray-800 text-sm mb-2">Request Body</h3>
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2 mb-4">
                <div className="flex items-start gap-4">
                  <code className="text-emerald-700 font-mono w-28 shrink-0">bedrooms *</code>
                  <span className="text-gray-600">Number of bedrooms (1, 2, 3, 4, 5, or &quot;6+&quot;)</span>
                </div>
                <div className="flex items-start gap-4">
                  <code className="text-emerald-700 font-mono w-28 shrink-0">location *</code>
                  <span className="text-gray-600">City name (e.g., &quot;Accra&quot;, &quot;Kumasi&quot;, &quot;Tamale&quot;)</span>
                </div>
                <div className="flex items-start gap-4">
                  <code className="text-emerald-700 font-mono w-28 shrink-0">finishGrade</code>
                  <span className="text-gray-600">&quot;basic&quot;, &quot;standard&quot; (default), or &quot;premium&quot;</span>
                </div>
              </div>

              <h3 className="font-semibold text-gray-800 text-sm mb-2">Response</h3>
              <div className="bg-gray-900 rounded-xl p-4 text-xs font-mono text-green-300 overflow-x-auto">
                {`{
  "success": true,
  "data": {
    "estimate": { "min": 340000, "max": 850000, "currency": "GHS" },
    "details": { "bedrooms": "3", "location": "Accra", "finishGrade": "standard" },
    "breakdown": {
      "materials": 187000,
      "labour": 85000,
      "supervision": 27200,
      "contingency": 40800
    }
  },
  "meta": { "requestedBy": "My App", "tier": "dev" }
}`}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-glass">
              <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Code className="h-5 w-5 text-emerald-600" /> Code Examples</h2>

              <div className="mb-4">
                <label className="text-xs text-gray-500 mb-1 block">Your API Key (optional — inserted into snippets)</label>
                <input
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="bc_..."
                  className="w-full h-9 rounded-lg border border-gray-200 px-3 text-sm font-mono"
                />
              </div>

              <div className="space-y-4">
                {snippets.map((s) => (
                  <div key={s.lang} className="relative">
                    <div className="flex items-center justify-between bg-gray-900 rounded-t-xl px-4 py-2">
                      <span className="text-xs text-gray-400 font-mono">{s.lang}</span>
                      <button onClick={() => copyCode(insertKey(s.code), s.lang)} className="text-gray-400 hover:text-white transition-colors">
                        {copied === s.lang ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <pre className="bg-gray-900 rounded-b-xl p-4 text-xs font-mono text-green-300 overflow-x-auto">{insertKey(s.code)}</pre>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-glass">
              <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2"><Key className="h-4 w-4 text-emerald-600" /> Authentication</h3>
              <p className="text-xs text-gray-600 mb-3">All API requests require an API key sent via the <code className="bg-gray-100 px-1 rounded text-emerald-700">Authorization</code> header.</p>
              <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-700">Authorization: Bearer bc_your_key_here</div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-glass">
              <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2"><Shield className="h-4 w-4 text-emerald-600" /> Rate Limits</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between"><span>Dev</span><span className="font-mono">100 req/mo</span></div>
                <div className="flex justify-between"><span>Pro</span><span className="font-mono">10,000 req/mo</span></div>
                <div className="flex justify-between"><span>Enterprise</span><span className="font-mono">Custom</span></div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-glass">
              <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4 text-emerald-600" /> Supported Locations</h3>
              <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                {["Accra", "Kumasi", "Tamale", "Takoradi", "Cape Coast", "Sunyani", "Ho", "Koforidua", "Bolgatanga", "Wa", "Techiman", "Sefwi Wiawso"].map(l => (
                  <span key={l} className="font-mono text-emerald-700">{l}</span>
                ))}
              </div>
            </motion.div>

            <a href="/api-pricing" className="block">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-5 text-white shadow-glass hover:shadow-lg transition-all">
                <h3 className="font-bold text-sm mb-1">API Pricing</h3>
                <p className="text-xs text-emerald-200 mb-3">Start free, scale as you grow</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-white/90">
                  View plans <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}