import { Resend } from "resend"

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

const from = "BuildCost GH <reports@buildcostgh.com>"

export async function sendReportReceipt(to: string, name: string, packageName: string, reference: string) {
  const resend = getResend()
  if (!resend) return
  return resend.emails.send({
    from,
    to,
    subject: `Your ${packageName} Construction Cost Report - BuildCost GH`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#059669,#047857);padding:30px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;">Thank You, ${name}!</h1>
        </div>
        <div style="background:#fff;border:1px solid #e5e7eb;border-top:0;padding:30px;border-radius:0 0 12px 12px;">
          <p style="color:#374151;font-size:16px;">Your <strong>${packageName}</strong> report is being generated.</p>
          <p style="color:#6b7280;font-size:14px;">Reference: <code style="background:#f3f4f6;padding:2px 8px;border-radius:4px;">${reference}</code></p>
          <p style="color:#6b7280;font-size:14px;">You will receive your PDF report within 24 hours. For Premium packages, we'll contact you within 24 hours to schedule your consultation call.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
          <p style="color:#9ca3af;font-size:12px;">BuildCost GH | Lashibi, Tema, Ghana | <a href="mailto:info@buildcostgh.com" style="color:#059669;">info@buildcostgh.com</a></p>
        </div>
      </div>
    `,
  })
}

export async function sendLeadNurture(email: string) {
  const resend = getResend()
  if (!resend) return
  return resend.emails.send({
    from,
    to: email,
    subject: "Continue Your Construction Cost Estimate - BuildCost GH",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#059669,#047857);padding:30px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;">Come Back and Finish!</h1>
        </div>
        <div style="background:#fff;border:1px solid #e5e7eb;border-top:0;padding:30px;border-radius:0 0 12px 12px;">
          <p style="color:#374151;font-size:16px;">You started a construction cost estimate but didn't finish it.</p>
          <p style="color:#6b7280;font-size:14px;">Your progress has been saved. Come back to see your estimate and get a detailed report.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/calculator?resume=true" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#059669,#047857);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
              Resume Your Estimate
            </a>
          </div>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
          <p style="color:#9ca3af;font-size:12px;">BuildCost GH | Lashibi, Tema, Ghana</p>
        </div>
      </div>
    `,
  })
}

export async function sendPasswordReset(to: string, resetUrl: string) {
  const resend = getResend()
  if (!resend) return
  return resend.emails.send({
    from,
    to,
    subject: "Reset Your Password - BuildCost GH",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#059669,#047857);padding:30px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;">Password Reset Request</h1>
        </div>
        <div style="background:#fff;border:1px solid #e5e7eb;border-top:0;padding:30px;border-radius:0 0 12px 12px;">
          <p style="color:#374151;font-size:16px;">We received a request to reset your password.</p>
          <p style="color:#6b7280;font-size:14px;">Click the button below to set a new password. This link expires in 1 hour.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#059669,#047857);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
              Reset Password
            </a>
          </div>
          <p style="color:#9ca3af;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
          <p style="color:#9ca3af;font-size:12px;">BuildCost GH | Lashibi, Tema, Ghana | <a href="mailto:info@buildcostgh.com" style="color:#059669;">info@buildcostgh.com</a></p>
        </div>
      </div>
    `,
  })
}

export async function sendGuideDownload(email: string) {
  const resend = getResend()
  if (!resend) return
  return resend.emails.send({
    from,
    to: email,
    subject: "Your Free Construction Cost Guide - BuildCost GH",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#D4A84B,#F0D78C);padding:30px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:#1A1A2E;margin:0;font-size:24px;">Here's Your Free Guide!</h1>
        </div>
        <div style="background:#fff;border:1px solid #e5e7eb;border-top:0;padding:30px;border-radius:0 0 12px 12px;">
          <p style="color:#374151;font-size:16px;">Thanks for downloading our Construction Cost Guide.</p>
          <p style="color:#6b7280;font-size:14px;">Click the button below to access your free PDF guide.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/guides/construction-cost-guide.pdf" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#D4A84B,#B8922E);color:#1A1A2E;text-decoration:none;border-radius:8px;font-weight:600;">
              Download PDF Guide
            </a>
          </div>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
          <p style="color:#9ca3af;font-size:12px;">BuildCost GH | Lashibi, Tema, Ghana</p>
        </div>
      </div>
    `,
  })
}
