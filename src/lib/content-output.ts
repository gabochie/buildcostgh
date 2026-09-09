/**
 * Pure, testable content output helpers — no "server-only", no I/O.
 * Consumed by content-engine.ts (batch parsing), social.ts (plan-date
 * extraction) and the unit test suite.
 */

import type { SocialPlatform } from "./social"
import type { DraftKind } from "./content-plan"

export type DraftOffer = {
  headline: string
  detail: string
  expiresInDays: number
  cta: string
}

export type DraftOutput = {
  kind: DraftKind
  title: string
  caption: string
  body: string | null
  offer: DraftOffer
  platforms: SocialPlatform[]
  imagePrompt?: string
  tags?: string[]
  category?: string
}

function stripQuotes(value: string): string {
  const v = value.trim()
  if (v.length >= 2 && ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))) {
    return v.slice(1, -1)
  }
  return v
}

function toDraftOutput(record: Record<string, unknown>): DraftOutput {
  const offer = (record.offer ?? {}) as Record<string, unknown>
  const platforms = Array.isArray(record.platforms) ? record.platforms.filter((p): p is SocialPlatform => typeof p === "string") : []
  const tags = Array.isArray(record.tags) ? record.tags.filter((t): t is string => typeof t === "string").slice(0, 8) : []

  return {
    kind: record.kind === "blog" ? "blog" : "social",
    title: stripQuotes(String(record.title ?? "")),
    caption: stripQuotes(String(record.caption ?? "")),
    body: record.body ? String(record.body) : null,
    offer: {
      headline: stripQuotes(String(offer.headline ?? "")),
      detail: stripQuotes(String(offer.detail ?? "")),
      expiresInDays: Number(offer.expiresInDays ?? 7),
      cta: stripQuotes(String(offer.cta ?? "Get your estimate")),
    },
    platforms,
    imagePrompt: typeof record.imagePrompt === "string" && record.imagePrompt.trim() ? record.imagePrompt.trim() : undefined,
    tags,
    category: typeof record.category === "string" && record.category.trim() ? record.category.trim() : undefined,
  }
}

function singleObjectToDraftOutput(text: string): DraftOutput | null {
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) return null
  let obj: unknown
  try {
    obj = JSON.parse(text.slice(start, end + 1))
  } catch {
    return null
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null
  return toDraftOutput(obj as Record<string, unknown>)
}

/**
 * Parse the LLM content output. Handles both a JSON array (batch) and a
 * single JSON object (legacy). Returns the posts in order, normalized.
 * Never throws — returns null when unparseable.
 */
export function parseDraftOutputs(text: string): DraftOutput[] | null {
  const trimmed = text.trim()

  const arrayStart = trimmed.indexOf("[")
  const arrayEnd = trimmed.lastIndexOf("]")
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    try {
      const raw = JSON.parse(trimmed.slice(arrayStart, arrayEnd + 1))
      if (!Array.isArray(raw)) return null
      const out = raw
        .map((item) => (item && typeof item === "object" ? toDraftOutput(item as Record<string, unknown>) : null))
        .filter((r): r is DraftOutput => r !== null)
      return out.length ? out : null
    } catch {
      return null
    }
  }

  const single = singleObjectToDraftOutput(trimmed)
  return single ? [single] : null
}

/**
 * ASCII slug from a blog/post title.
 * "How Much Does a 4-Bedroom House Cost in Ghana?" →
 * "how-much-does-a-4-bedroom-house-cost-in-ghana"
 */
export function slugifyTitle(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return base || "post"
}

export function blogCategoryFor(pillarKey: string): string {
  return pillarKey.replace(/-/g, "-")
}

export function estimateReadTime(body: string | null): number {
  if (!body) return 0
  const words = body.split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

/**
 * Extract the plan date from a draft source string of the form
 * `content-plan:2026-09-14:cost-guides:0`.
 */
export function planDateForSource(source: string | null): Date | null {
  if (!source || !source.startsWith("content-plan:")) return null
  const match = /^content-plan:(\d{4}-\d{2}-\d{2}):/.exec(source)
  if (!match) return null
  const d = new Date(`${match[1]}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}