import Link from "next/link"
import { Hammer, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
      <div className="text-center px-4 max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200">
          <Hammer className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-7xl font-heading font-bold text-gray-900 mb-2">404</h1>
        <p className="text-xl font-heading font-semibold text-charcoal mb-2">Page Not Found</p>
        <p className="text-gray-500 mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-primary text-white font-semibold hover:opacity-90 transition-opacity shadow-glow-emerald"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  )
}
