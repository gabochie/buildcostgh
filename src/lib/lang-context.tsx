"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { Locale } from "@/lib/i18n"

const LANG_KEY = "buildcost-locale"

interface LangContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (path: string, params?: Record<string, string | number>) => string
}

const LangContext = createContext<LangContextValue | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")

  useEffect(() => {
    const saved = localStorage.getItem(LANG_KEY) as Locale | null
    if (saved && (saved === "en" || saved === "tw")) setLocaleState(saved)
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem(LANG_KEY, l)
  }, [])

  const t = useCallback(async (path: string, params?: Record<string, string | number>) => {
    const { t: translate } = await import("@/lib/i18n")
    return translate(locale, path, params)
  }, [locale])

  return (
    <LangContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error("useLang must be used within LangProvider")
  return ctx
}
