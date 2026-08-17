"use client"

export default function RootError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
        <span className="text-2xl">!</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
      <p className="text-sm text-gray-500 text-center max-w-md">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700"
      >
        Try Again
      </button>
    </div>
  )
}
