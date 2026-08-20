"use client"

import { useLang } from "@/lib/lang-context"
import { Globe } from "lucide-react"
import type { Locale } from "@/lib/i18n"

const options: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "tw", label: "Twi" },
]

export function LanguageSwitcher() {
  const { locale, setLocale } = useLang()

  return (
    <div className="relative group">
      <button className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-emerald-700 transition-colors">
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{locale === "en" ? "EN" : "TW"}</span>
      </button>
      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[120px]">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setLocale(opt.value)}
            className={`w-full text-left px-3 py-2 text-sm transition-colors ${
              locale === opt.value
                ? "bg-emerald-50 text-emerald-700 font-medium"
                : "text-gray-700 hover:bg-gray-50"
            } first:rounded-t-lg last:rounded-b-lg`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
