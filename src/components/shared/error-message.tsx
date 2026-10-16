"use client"

// ── Never render raw error messages to users ──
// `error.message` from a server component / Prisma / fetch can embed table
// names, SQL fragments, file paths, or auth internals. Error boundaries must
// show generic copy and log the real error (with Next's `digest` for
// server-side correlation) instead.

export type ErrorWithDigest = Error & { digest?: string }

export function safeErrorMessage(error: unknown): string {
  if (error instanceof Error && (error as ErrorWithDigest).digest) {
    return `Something went wrong (ref ${(error as ErrorWithDigest).digest}). Please try again or contact support with this reference.`
  }
  return "Something went wrong. Please try again."
}

export function logClientError(scope: string, error: unknown) {
  if (error instanceof Error) {
    const { message, stack } = error
    const digest = (error as ErrorWithDigest).digest
    console.error(`[${scope}]`, { message, digest, stack })
    return
  }
  console.error(`[${scope}]`, error)
}
