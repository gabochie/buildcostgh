# Phase 6: Email Automation

## Setup

### 1. Install Resend

```bash
npm install resend
```

### 2. `src/lib/email.ts`

```ts
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY!)
const from = "BuildCost GH <reports@buildcostgh.com>"

export async function sendReportReceipt(to: string, name: string, packageName: string, reference: string) {
  return resend.emails.send({
    from,
    to,
    subject: `Your ${packageName} Construction Cost Report - BuildCost GH`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#059669;">Thank You, ${name}!</h1>
        <p>Your <strong>${packageName}</strong> report is being generated.</p>
        <p>Reference: ${reference}</p>
        <p>You will receive your PDF report within 24 hours.</p>
        <hr />
        <p style="color:#666;font-size:12px;">BuildCost GH | Lashibi, Tema, Ghana</p>
      </div>
    `,
  })
}

export async function sendLeadNurture(email: string, name: string) {
  return resend.emails.send({
    from,
    to: email,
    subject: "Continue Your Construction Cost Estimate",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#059669;">Come Back and Finish!</h1>
        <p>You started a construction cost estimate but didnt finish.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/calculator?resume=true"
           style="display:inline-block;padding:12px 24px;background:#059669;color:white;text-decoration:none;border-radius:8px;">
          Resume Your Estimate
        </a>
      </div>
    `,
  })
}

export async function sendGuideDownload(email: string, name: string) {
  return resend.emails.send({
    from,
    to: email,
    subject: "Your Free Construction Cost Guide - BuildCost GH",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#059669;">Here\'s Your Free Guide!</h1>
        <p>Thanks for downloading our Construction Cost Guide.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/guides/construction-cost-guide.pdf">Download PDF</a></p>
      </div>
    `,
  })
}
```

### 3. Email Templates Folder

Create `email-templates/` with HTML templates for:
- `receipt.html` — Purchase receipt
- `report-delivery.html` — Report ready to download
- `lead-nurture.html` — Abandoned calculator reminder
- `guide-download.html` — Lead magnet delivery

### 4. Integration Points

Add to `api/paystack/verify/route.ts`:
```ts
import { sendReportReceipt } from "@/lib/email"

// After marking order as completed:
await sendReportReceipt(order.email, order.fullName, order.package, order.reference)
```

Add to `api/calculator/save-lead/route.ts` (from Phase 3):
```ts
// Schedule abandoned cart email after 24h:
// Use a cron job or inngest to send sendLeadNurture after 24h
```

### 5. `.env` Update

```
RESEND_API_KEY=re_xxxxxxxxxxxx
```
