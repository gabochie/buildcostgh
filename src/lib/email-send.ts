// Single email-sending interface for the whole app.
//
// Channel order (first success wins):
//   1. resend-sdk  — `resend` package (batched, typed errors)
//   2. resend-http — raw `fetch` to api.resend.com (no SDK dependency path)
//   3. smtp        — Gmail via nodemailer (`lib/mail.ts`), the vendor exit path
//
// All channels are optional and env-gated. Callers never touch Resend or
// SMTP directly — to swap vendors, change this file (+ `lib/mail.ts`) only.
// `forceChannel` exists for the admin email-test endpoint and fallback drills.

import { Resend } from "resend"
import { sendEmail as sendViaSmtp } from "./mail"

export type EmailChannel = "resend-sdk" | "resend-http" | "smtp"

export interface SendEmailInput {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
  forceChannel?: EmailChannel
}

export interface SendEmailResult {
  ok: boolean
  channel: EmailChannel | null
  error?: string
}

export const DEFAULT_FROM = "BuildCost GH <reports@buildcostgh.com>"

function resendKey(): string | null {
  return process.env.RESEND_API_KEY || null
}

function smtpConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
}

async function viaSdk(input: SendEmailInput): Promise<void> {
  const key = resendKey()
  if (!key) throw new Error("RESEND_API_KEY not configured")
  const resend = new Resend(key)
  const { error } = await resend.emails.send({
    from: input.from || DEFAULT_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  })
  if (error) throw new Error(error.message || "Resend SDK error")
}

async function viaHttp(input: SendEmailInput): Promise<void> {
  const key = resendKey()
  if (!key) throw new Error("RESEND_API_KEY not configured")
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: input.from || DEFAULT_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  })
  if (!res.ok) throw new Error(`Resend HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
}

async function viaSmtp(input: SendEmailInput): Promise<void> {
  if (!smtpConfigured()) throw new Error("GMAIL_USER/GMAIL_APP_PASSWORD not configured")
  const ok = await sendViaSmtp({ to: input.to, subject: input.subject, html: input.html })
  if (!ok) throw new Error("SMTP send failed")
}

const CHANNELS: Record<EmailChannel, (input: SendEmailInput) => Promise<void>> = {
  "resend-sdk": viaSdk,
  "resend-http": viaHttp,
  smtp: viaSmtp,
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const order: EmailChannel[] = input.forceChannel
    ? [input.forceChannel]
    : ["resend-sdk", "resend-http", "smtp"]

  let lastError = "no email channel configured"
  for (const channel of order) {
    try {
      await CHANNELS[channel](input)
      return { ok: true, channel }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
    }
  }
  return { ok: false, channel: null, error: lastError }
}

/** True when at least one channel can attempt delivery. */
export function isEmailConfigured(): boolean {
  return Boolean(resendKey() || smtpConfigured())
}
