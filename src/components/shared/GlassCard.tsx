import { cn } from "@/lib/utils"

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function GlassCard({ children, className, hover = true }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-2xl p-6 shadow-glass transition-all duration-300",
        hover && "hover:shadow-glass-lg hover:-translate-y-0.5",
        className
      )}
    >
      {children}
    </div>
  )
}
