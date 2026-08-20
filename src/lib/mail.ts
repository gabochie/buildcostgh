import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  replyTo?: string
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions): Promise<boolean> {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn("[Mail] Gmail credentials not configured. Skipping email send.")
      return false
    }

    await transporter.sendMail({
      from: `"BuildCost GH" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      replyTo,
    })

    console.log(`[Mail] Sent to ${to}: ${subject}`)
    return true
  } catch (error) {
    console.error("[Mail] Failed to send:", error)
    return false
  }
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  userName?: string
): Promise<boolean> {
  const name = userName || "there"
  return sendEmail({
    to,
    subject: "Reset Your BuildCost GH Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #059669, #047857); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">BuildCost GH</h1>
        </div>
        <h2 style="color: #1f2937; font-size: 20px;">Hello ${name},</h2>
        <p style="color: #4b5563; line-height: 1.6;">
          We received a request to reset your password. Click the button below to create a new password:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: #059669; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Reset Password
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          BuildCost GH — Ghana's Building Cost Intelligence Platform<br/>
          <a href="https://buildcostgh.com" style="color: #059669;">buildcostgh.com</a>
        </p>
      </div>
    `,
  })
}

export async function sendWelcomeEmail(
  to: string,
  userName: string
): Promise<boolean> {
  return sendEmail({
    to,
    subject: "Welcome to BuildCost GH!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #059669, #047857); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to BuildCost GH!</h1>
        </div>
        <h2 style="color: #1f2937; font-size: 20px;">Hello ${userName},</h2>
        <p style="color: #4b5563; line-height: 1.6;">
          Your account is set up. Here's what you can do:
        </p>
        <ul style="color: #4b5563; line-height: 2;">
          <li><strong>Calculate costs</strong> for any building type in any Ghana region</li>
          <li><strong>Save estimates</strong> to your dashboard and compare scenarios</li>
          <li><strong>Download reports</strong> as PDF or Excel</li>
          <li><strong>Check permit requirements</strong> for your location</li>
        </ul>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://buildcostgh.com/calculator" style="background: #059669; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Start Your First Estimate
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          BuildCost GH — Ghana's Building Cost Intelligence Platform<br/>
          <a href="https://buildcostgh.com" style="color: #059669;">buildcostgh.com</a>
        </p>
      </div>
    `,
  })
}
