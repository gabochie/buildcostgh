"use client"

import { useEffect } from "react"

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || ""

function loadAdsByGoogleScript() {
  if (typeof document === "undefined") return
  if (!ADSENSE_CLIENT) return
  if (document.getElementById("adsbygoogle-script")) return
  const s = document.createElement("script")
  s.id = "adsbygoogle-script"
  s.async = true
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`
  s.crossOrigin = "anonymous"
  document.head.appendChild(s)
}

export function AdUnit({ slot }: { slot: string }) {
  useEffect(() => {
    loadAdsByGoogleScript()
  }, [])

  if (!slot) return null

  if (!ADSENSE_CLIENT) {
    return (
      <div
        aria-label="Advertisement slot"
        className="my-8 min-h-[100px] flex items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400"
      >
        Advertisement placeholder · slot {slot}
      </div>
    )
  }

  return (
    <div className="my-8 min-h-[100px]">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      <script
        dangerouslySetInnerHTML={{
          __html: "(adsbygoogle = window.adsbygoogle || []).push({});",
        }}
      />
    </div>
  )
}