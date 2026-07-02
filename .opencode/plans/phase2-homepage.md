# Phase 2: Conversion-Focused Homepage

## Replace `src/app/page.tsx`

The homepage needs a complete rewrite with these sections:

### Hero Section
- Full-width gradient background (emerald to charcoal)
- Headline: "Build Your Dream Home in Ghana with Confidence"
- Subheadline with social proof: "Join 10,000+ Ghanaians who saved time and money"
- Two CTAs: "Get Your Free Estimate" (emerald gradient) + "Watch Demo" (gold outline)
- Floating 3D-style estimate preview card (positioned absolute, slightly overlapping)
- Trust badges row: "Paystack Secure" | "SSL Encrypted" | "Ghana Data Compliant"

### Stats Bar
- Animated counters: 10,000+ Calculations | 98% Accuracy | 50+ Contractors | 24/7 Support
- Use AnimatedCounter component from Phase 1

### Video Demo Section
- Embedded YouTube video with custom play button overlay
- "See how it works in 60 seconds"

### Social Proof Wall
- 3 TestimonialCard components with real-looking testimonials
- Star ratings (5 stars)
- "As featured on" media logos strip

### How It Works
- 4 animated steps using Framer Motion staggered reveal
- Each step: icon + number + title + description
- Visual connector lines between steps

### Sample Estimate Preview
- Glass card showing a live estimate preview
- Animated price that counts up on scroll
- Breakdown bars (foundation, structure, finishing, services)

### Lead Magnet Section
- "Get Your Free Construction Cost Guide PDF"
- Email capture input + CTA
- "Limited time offer" micro-urgency text

### Final CTA
- Split background with overlapping elements
- "Ready to Build? Start Your Free Estimate Now"
- Single strong CTA button

## Key Code Patterns

All "use client" for animations. Use framer-motion:

```tsx
import { motion } from "framer-motion"
import { AnimatedCounter, GradientButton, GlassCard, TestimonialCard } from "@/components/shared"
import { useInView } from "framer-motion"

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
}
```

Use stagger containers:
```tsx
<motion.div
  variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
>
```
