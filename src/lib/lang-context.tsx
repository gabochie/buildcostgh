"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { t as translate, type Locale } from "@/lib/i18n"

const LANG_KEY = "buildcost-locale"

interface LangContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (path: string, params?: Record<string, string | number>) => string
}

const LangContext = createContext<LangContextValue | null>(null)

function initialLocale(): Locale {
  // Run only during client initial render (window exists). SSR returns "en".
  if (typeof window === "undefined") return "en"
  const saved = window.localStorage.getItem(LANG_KEY) as Locale | null
  return saved === "en" || saved === "tw" ? saved : "en"
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem(LANG_KEY, l)
  }, [])

  const t = useCallback((path: string, params?: Record<string, string | number>) => {
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
