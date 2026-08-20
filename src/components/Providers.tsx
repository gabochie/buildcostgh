"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "@/components/ui/sonner"
import { useEffect, useState } from "react"
import { useCalculatorStore } from "@/store/calculatorStore"
import { LangProvider } from "@/lib/lang-context"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  useEffect(() => {
    useCalculatorStore.persist.rehydrate()
  }, [])

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <LangProvider>
          {children}
        </LangProvider>
        <Toaster richColors />
      </QueryClientProvider>
    </SessionProvider>
  )
}
