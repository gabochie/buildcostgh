import Link from "next/link"
import { WifiOff, Calculator, Home } from "lucide-react"

export const metadata = {
  title: "Offline — BuildCost GH",
  description: "You are offline. Your calculator inputs are saved and will sync when you reconnect.",
}

export default function OfflinePage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
          <WifiOff className="h-8 w-8 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">You&apos;re offline</h1>
          <p className="mt-2 text-sm text-gray-500">
            No internet connection. The good news: the cost calculator works fully offline —
            your inputs are saved on this device and queued estimates sync automatically when you reconnect.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/calculator"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors min-h-[44px]"
          >
            <Calculator className="h-4 w-4" /> Open calculator
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            <Home className="h-4 w-4" /> Go home
          </Link>
        </div>
        <p className="text-xs text-gray-400">Queued estimates sync in the background via Background Sync.</p>
      </div>
    </div>
  )
}
