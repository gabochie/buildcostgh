# Phase 5: Analytics & Tracking

## New Files

### 1. `src/lib/analytics.ts`

Centralized analytics helper:

```ts
type EventName =
  | "calculator_started"
  | "calculator_step_completed"
  | "estimate_viewed"
  | "checkout_started"
  | "purchase_completed"
  | "email_captured"
  | "lead_magnet_downloaded"

export function trackEvent(event: EventName, data?: Record<string, unknown>) {
  // GA4
  if (typeof window !== "undefined" && (window as any).gtag) {
    ;(window as any).gtag("event", event, data)
  }
  // Facebook Pixel
  if (typeof window !== "undefined" && (window as any).fbq) {
    ;(window as any).fbq("track", event, data)
  }
  // Console in dev
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics]", event, data)
  }
}
```

### 2. GA4 Config in `.env` + `Analytics.tsx` (from Phase 1)

```
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_FB_PIXEL=1234567890
```

### 3. Conversion Events to Add Throughout App

In **Calculator** (`Step5Result.tsx`):
```ts
useEffect(() => {
  if (result) trackEvent("estimate_viewed", { total: result.breakdown.total, location: step1.location })
}, [result])
```

In **Pricing** (`pricing/page.tsx`):
```ts
const handleBuyClick = (pkg: string, price: number) => {
  trackEvent("checkout_started", { package: pkg, price })
  // open form
}
```

In **Paystack verify** (`api/paystack/verify/route.ts`):
```ts
// On success, track purchase
// trackEvent("purchase_completed", { reference, amount, package })
```

### 4. Hotjar Setup

Add to `Analytics.tsx`:
```tsx
const hotjarId = process.env.NEXT_PUBLIC_HOTJAR_ID
if (hotjarId) {
  <Script id="hotjar" strategy="afterInteractive">{`
    (function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
    h._hjSettings={hjid:${hotjarId},hjsv:6};
    a=o.getElementsByTagName('head')[0];
    r=o.createElement('script');r.async=1;
    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
    a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
  `}</Script>
}
```

### 5. UTM Tracking

Add to the Paystack order metadata:
```ts
// In pricing page before calling /api/paystack/initialize:
const urlParams = new URLSearchParams(window.location.search)
const utmSource = urlParams.get("utm_source") || ""
const utmMedium = urlParams.get("utm_medium") || ""
const utmCampaign = urlParams.get("utm_campaign") || ""

// Include in metadata:
metadata: { utm_source: utmSource, utm_medium: utmMedium, utm_campaign: utmCampaign, ... }
```
