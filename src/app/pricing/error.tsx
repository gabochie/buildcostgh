"use client"

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
      <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
      <p className="text-sm text-gray-500 text-center max-w-md">We couldn&apos;t load pricing information.</p>
      <button onClick={reset} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700">Try Again</button>
    </div>
  )
}