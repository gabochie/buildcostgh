"use client"

import { forwardRef } from "react"
import { cn } from "@/lib/utils"

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "emerald" | "gold" | "outline"
  size?: "sm" | "md" | "lg"
  isLoading?: boolean
}

export const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant = "emerald", size = "md", isLoading, children, ...props }, ref) => {
    const baseStyles =
      "relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300 overflow-hidden group"

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    }

    const variants = {
      emerald:
        "bg-gradient-primary text-white hover:shadow-lg hover:shadow-emerald-200 hover:scale-[1.02] active:scale-[0.98]",
      gold: "bg-gradient-gold text-charcoal hover:shadow-lg hover:shadow-gold/30 hover:scale-[1.02] active:scale-[0.98]",
      outline: "border-2 border-emerald-600 text-emerald-700 bg-transparent hover:bg-emerald-50",
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, sizes[size], variants[variant], isLoading && "opacity-70 cursor-not-allowed", className)}
        disabled={isLoading}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-2">
          {isLoading && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {children}
        </span>
      </button>
    )
  }
)
GradientButton.displayName = "GradientButton"
