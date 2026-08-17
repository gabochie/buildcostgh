"use client"

import Script from "next/script"
import { useEffect, useRef, useCallback, useId } from "react"

declare global {
  interface Window {
    onTurnstileSuccess?: (token: string) => void
    turnstile?: { reset: (widgetId: string) => void; render: (container: HTMLElement, options: Record<string, unknown>) => string }
  }
}

interface TurnstileWidgetProps {
  sitekey: string
  onVerify: (token: string) => void
  className?: string
  action?: string
}

export function TurnstileWidget({ sitekey, onVerify, className, action }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const id = useId()
  const cbName = `onTurnstileSuccess${id.replace(/:/g, "_")}`

  const handleSuccess = useCallback((token: string) => {
    onVerify(token)
  }, [onVerify])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any)[cbName] = (token: string) => handleSuccess(token)

    const interval = setInterval(() => {
      if (window.turnstile && containerRef.current && !widgetIdRef.current) {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey,
          callback: cbName,
          theme: "light",
          "error-theme": "light",
          ...(action ? { action } : {}),
        })
        clearInterval(interval)
      }
    }, 100)

    return () => {
      clearInterval(interval)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any)[cbName]
    }
  }, [sitekey, handleSuccess, action, cbName])

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div className={className}>
        <div ref={containerRef} className="cf-turnstile" data-sitekey={sitekey} data-action={action || "turnstile-spin-v2"} />
      </div>
    </>
  )
}
