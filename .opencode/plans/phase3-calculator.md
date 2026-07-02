# Phase 3: High-Converting Calculator

## Key Changes

### 1. New Step: Email Capture (`src/components/calculator/Step2point5Email.tsx`)

Inserted between Step 2 (Floor Size) and Step 3 (Finishing):

- Headline: "Save Your Progress & Unlock Full Results"
- Body: "Enter your email to save your calculation and get the full detailed estimate"
- Email input + "Continue" button
- On submit: POST to `/api/calculator/save-lead` storing email + partial data
- Returns a token/ID for the session
- Sets `hasEmail: true` in the calculator store

This is the #1 revenue lever — captures leads before they see results.

### 2. Updated Calculator Store (`src/store/calculatorStore.ts`)

Add fields:
```ts
hasEmail: boolean
sessionId: string | null
setHasEmail: (val: boolean) => void
setSessionId: (id: string) => void
```

### 3. Result Page Redesign (`src/components/calculator/Step5Result.tsx`)

Replace with premium version:

- **Animated price reveal**: Count-up animation from 0 to total
- **Visual bar chart**: Use simple CSS bars (or recharts) showing breakdown
  - Foundation: GHS 45,000 ████████
  - Structure: GHS 85,000 ████████████████
  - Finishing: GHS 95,000 ██████████████████
  - Services: GHS 25,000 █████
- **Region comparison**: Toggle to see estimate in Accra vs Kumasi vs Tamale
- **Urgency banner**: "Get the full detailed report for just GHS 99 (Limited Time)"
- **Save & Return**: "Email me this estimate" button
- **Social proof**: "5,000+ Ghanaians have used this calculator"

### 4. Calculator Page Updates (`src/app/calculator/page.tsx`)

- Animated progress bar at top showing "Step X of 5 — XX% complete"
- Framer Motion page transitions between steps (slide left/right)
- Sticky "Save & Continue Later" button in corner

### 5. New API Route: `src/app/api/calculator/save-lead/route.ts`

```ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const { email, bedrooms, location, floorArea, floors } = await request.json()
  
  const lead = await prisma.calculatorLead.create({
    data: { email, bedrooms, location, floorArea, floors, completed: false }
  })

  // TODO: Send abandoned email via Resend after 24h
  
  return NextResponse.json({ id: lead.id })
}
```

### 6. Prisma Schema Addition

Add to `prisma/schema.prisma`:

```prisma
model CalculatorLead {
  id        String   @id @default(cuid())
  email     String
  bedrooms  String?
  location  String?
  floorArea String?
  floors    String?
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

Run `npx prisma migrate dev --name add-calculator-lead` after adding.
