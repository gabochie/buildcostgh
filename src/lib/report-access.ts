import crypto from "node:crypto"
import { prisma } from "./prisma"
import { auth } from "./auth"

/**
 * Signed, expiring report-download token.
 *
 * Reports are no longer served as static files in /public. Instead the on-disk
 * file is guarded and can only be fetched through an API route that requires
 * either (a) a valid short-lived download token, or (b) an authenticated
 * session that owns the order.
 */
const SECRET = process.env.AUTH_SECRET || process.env.REPORT_TOKEN_SECRET || ""
const TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

/** Directory that holds generated PDF/XLSX reports. Kept OUTSIDE /public. */
export const REPORT_DIR = process.env.REPORT_DIR || "reports-storage"

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex")
}

export function createReportToken(reference: string): string {
  const expires = Date.now() + TOKEN_TTL_MS
  const body = `${reference}:${expires}`
  return `${body}:${sign(body)}`
}

export function verifyReportToken(reference: string, token: string): boolean {
  if (!token) return false
  const parts = token.split(":")
  if (parts.length !== 3) return false
  const [ref, exp, sig] = parts
  if (ref !== reference) return false
  if (Number(exp) < Date.now()) return false
  const expected = sign(`${ref}:${exp}`)
  const a = Buffer.from(sig, "utf8")
  const b = Buffer.from(expected, "utf8")
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

/**
 * Check whether the caller may download `reference`'s report.
 * Grants access when a valid session owns the order OR a valid signed token
 * for that reference is supplied.
 */
export async function canAccessReport(
  reference: string,
  token?: string | null
): Promise<{ allowed: boolean; status: number }> {
  if (token && verifyReportToken(reference, token)) {
    return { allowed: true, status: 200 }
  }

  const session = await auth()
  const callerEmail = session?.user?.email
  const callerId = session?.user?.id
  if (!callerEmail && !callerId) {
    return { allowed: false, status: 401 }
  }

  const order = await prisma.order.findUnique({ where: { reference } })
  if (!order) {
    return { allowed: false, status: 404 }
  }

  const owns =
    (callerId && order.userId === callerId) ||
    (callerEmail && order.email && order.email.toLowerCase() === callerEmail.toLowerCase())

  return owns ? { allowed: true, status: 200 } : { allowed: false, status: 403 }
}
