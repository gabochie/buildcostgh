"use client"

import { Link as LinkIcon } from "lucide-react"
import { toast } from "sonner"

const FbIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
)
const XIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
)
const LiIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
)

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const encoded = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const shareLinks = [
    { label: "Facebook", href: `https://facebook.com/sharer/sharer.php?u=${encoded}`, icon: FbIcon },
    { label: "X (Twitter)", href: `https://x.com/intent/tweet?url=${encoded}&text=${encodedTitle}`, icon: XIcon },
    { label: "LinkedIn", href: `https://linkedin.com/sharing/share-offsite/?url=${encoded}`, icon: LiIcon },
  ]

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Link copied!")
    } catch {
      toast.error("Failed to copy")
    }
  }

  return (
    <div className="flex items-center gap-2 pt-6 border-t border-gray-200">
      <span className="text-sm text-gray-500 mr-2">Share:</span>
      {shareLinks.map((s) => {
        const Icon = s.icon
        return (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full bg-gray-100 hover:bg-emerald-100 text-gray-600 hover:text-emerald-700 transition-colors"
            aria-label={s.label}
          >
            <Icon />
          </a>
        )
      })}
      <button
        onClick={copyLink}
        className="p-2 rounded-full bg-gray-100 hover:bg-emerald-100 text-gray-600 hover:text-emerald-700 transition-colors"
        aria-label="Copy link"
      >
        <LinkIcon className="h-4 w-4" />
      </button>
    </div>
  )
}
