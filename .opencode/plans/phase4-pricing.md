# Phase 4: Premium Pricing Page

## Replace `src/app/pricing/page.tsx`

### New Structure

#### 1. Hero Section
- Headline: "Choose Your Package — Get Detailed Construction Reports"
- Subheadline: "From quick estimates to full project management"
- Trust indicator: "7-Day Money-Back Guarantee" badge

#### 2. Pricing Cards (3 columns)
Each card now has:
- Direct "Buy Now" button (no click-to-select-then-form pattern)
- Price highlighted with gold gradient for "Detailed" tier
- "Most Popular" badge with gold styling (not just emerald)
- Feature list with checkmarks
- Guarantee text below price

#### 3. Feature Comparison Table (below cards)
- Rows: every feature across all 3 tiers
- Columns: Basic | Detailed | Premium
- Checkmark/X indicators
- Highlights the differences to upsell from Basic → Detailed

#### 4. FAQ Accordion
Add below comparison table:
- "What exactly is included in the report?"
- "How quickly will I receive my report?"
- "Can I get a refund if Im not satisfied?"
- "Do you offer custom quotes for commercial projects?"
- "How is the cost data updated?"

Use shadcn Accordion component.

#### 5. Checkout Form (per card, inline)
Each card should have its own form section that expands when "Buy Now" is clicked:
- Full Name
- Email
- Phone
- Project Notes
- "Pay GHS XX with Paystack" button
- Trust badges row below

#### 6. Social Proof Section
- 2-3 TestimonialCards
- "Trusted by 10,000+ Ghanaians"

#### 7. Guarantee Section
- Full-width banner: "7-Day Money-Back Guarantee"
- "If youre not satisfied with your report, well refund your full purchase. No questions asked."

## AOV (Average Order Value) Tactics

1. **Annual pricing**: Show "Pay once" vs "Payment plan" toggle
2. **Bundle upsell**: "Add Contractor Database Access — GHS 49"
3. **Urgency**: "⭐ 247 people purchased the Detailed package this week"
4. **Scarcity**: "Premium: Only 5 spots available this month (1-on-1 consultation limited)"
