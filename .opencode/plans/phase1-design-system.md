# Phase 1: Design System & Visual Identity

## Files to modify/create

### 1. `src/app/globals.css` — Complete Rewrite

Replace the entire file with:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-heading: var(--font-playfair), ui-serif, Georgia, serif;
  --color-gold: #D4A84B;
  --color-gold-light: #F0D78C;
  --color-charcoal: #1A1A2E;
  --shadow-glass: 0 8px 32px rgba(0,0,0,0.06);
  --shadow-glass-lg: 0 20px 60px rgba(0,0,0,0.08);
}

:root {
  --background: oklch(0.98 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: #059669;
  --accent: #D4A84B;
  --accent-foreground: #1A1A2E;
  --ring: #059669;
}

@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
  html { @apply font-sans scroll-smooth; }
  h1, h2, h3, h4, h5, h6 { @apply font-heading; }
}

@layer utilities {
  .bg-gradient-primary { background: linear-gradient(135deg, #059669, #047857, #064E3B); }
  .bg-gradient-gold { background: linear-gradient(135deg, #D4A84B, #F0D78C, #B8922E); }
  .text-gradient-gold {
    background: linear-gradient(135deg, #D4A84B, #F0D78C);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .glass {
    background: rgba(255,255,255,0.7); backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.2);
  }
}
```

### 2. `src/app/layout.tsx` — Fonts

Change import to add Inter and Playfair Display. Replace `Geist` with `Inter` and `Playfair_Display`.

### 3. New components in `src/components/shared/`

Create: GradientButton.tsx, GlassCard.tsx, AnimatedCounter.tsx, TestimonialCard.tsx, Analytics.tsx, index.ts
