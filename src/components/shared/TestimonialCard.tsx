import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface TestimonialCardProps {
  name: string
  role: string
  content: string
  rating?: number
  avatar?: string
  className?: string
}

export function TestimonialCard({ name, role, content, rating = 5, avatar, className }: TestimonialCardProps) {
  return (
    <div className={cn("glass rounded-2xl p-6 shadow-glass", className)}>
      <div className="flex gap-1 mb-3">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-gold text-gold" />
        ))}
      </div>
      <p className="text-gray-600 text-sm leading-relaxed mb-4">&ldquo;{content}&rdquo;</p>
      <div className="flex items-center gap-3">
        {avatar ? (
          <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
            {name.split(" ").map((n) => n[0]).join("")}
          </div>
        )}
        <div>
          <p className="font-semibold text-sm text-gray-900">{name}</p>
          <p className="text-xs text-gray-500">{role}</p>
        </div>
      </div>
    </div>
  )
}
