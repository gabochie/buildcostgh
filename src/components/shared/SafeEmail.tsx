import React from "react"

/**
 * Renders an email address as plain text with NO contiguous `user@domain`
 * string in the HTML output.
 *
 * Cloudflare Email Address Obfuscation scans SSR'd HTML for plaintext email
 * addresses and rewrites them to `/cdn-cgi/l/email-protection` + a
 * `data-cfemail` span. The RSC payload is NOT rewritten, so hydration throws
 * "Hydration failed because the server rendered HTML didn't match the client"
 * (error #418). Splitting local/domain around a `<span>` boundary means the
 * obfuscation regex never matches, so server and client HTML stay identical.
 */
export function EmailText({
  email,
  className,
}: {
  email: string
  className?: string
}) {
  const [local, domain] = email.split("@")
  return (
    <span className={className}>
      {local}
      <span>@</span>
      {domain}
    </span>
  )
}

/**
 * Renders a `mailto:` link whose href uses `%40` (percent-encoded @) and whose
 * visible text is split via EmailText, so Cloudflare's email obfuscation regex
 * never matches and hydration is not broken. Browsers decode `%40` back to `@`
 * when opening the mail client.
 */
export function SafeEmail({
  email,
  className,
  children,
  subject,
}: {
  email: string
  className?: string
  children?: React.ReactNode
  subject?: string
}) {
  const [local, domain] = email.split("@")
  const query = subject ? `?subject=${subject}` : ""
  return (
    <a href={`mailto:${local}%40${domain}${query}`} className={className}>
      {children ?? <EmailText email={email} />}
    </a>
  )
}
