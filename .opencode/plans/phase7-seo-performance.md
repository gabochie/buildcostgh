# Phase 7: SEO & Performance

## 1. Dynamic Metadata

### Update all page.tsx files with generateMetadata

For blog posts (`src/app/blog/[slug]/page.tsx`):
```tsx
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.blogPost.findUnique({ where: { slug } })
  if (!post) return {}
  return {
    title: `${post.title} - BuildCost GH Blog`,
    description: post.excerpt || "",
    openGraph: {
      title: post.title,
      description: post.excerpt || "",
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      images: post.imageUrl ? [{ url: post.imageUrl }] : [],
    },
  }
}
```

For pricing page (`src/app/pricing/page.tsx`):
```tsx
export const metadata: Metadata = {
  title: "Pricing - Construction Cost Reports | BuildCost GH",
  description: "Choose from Basic, Detailed, or Premium construction cost report packages. Get accurate estimates for your Ghana building project.",
}
```

## 2. Structured Data (JSON-LD)

### Create `src/app/ld.ts`
```ts
export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BuildCost GH",
    url: process.env.NEXT_PUBLIC_APP_URL,
    logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+233-53-936-4716",
      contactType: "customer service",
      areaServed: "GH",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Tema",
      addressRegion: "Greater Accra",
      addressCountry: "GH",
    },
  }
}

export function productLd(name: string, price: number, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: "GHS",
      availability: "https://schema.org/InStock",
    },
  }
}
```

### Add JSON-LD to root layout
In `src/app/layout.tsx`, add:
```tsx
import { organizationLd } from "./ld"

// In the component:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd()) }}
/>
```

## 3. Sitemap

### Create `src/app/sitemap.ts`
```ts
import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://buildcostgh.com"

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 1 },
    { url: `${baseUrl}/calculator`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
  ]

  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
  })

  const blogPages = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))

  return [...staticPages, ...blogPages]
}
```

## 4. Robots

### Create `src/app/robots.ts`
```ts
import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
  }
}
```

## 5. Image Optimization

Replace all `<img>` tags with Next.js `<Image>`:
```tsx
import Image from "next/image"

// Before: <img src={url} alt={alt} />
// After:  <Image src={url} alt={alt} width={800} height={600} className="..." />
```

### Update `next.config.ts` for remote images:
```ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "images.unsplash.com" },
    { protocol: "https", hostname: "lh3.googleusercontent.com" },
    { protocol: "https", hostname: "ucarecdn.com" },
  ],
},
```

## 6. Performance Optimizations

### Add to layout.tsx:
```tsx
// Enable React strict mode
// Already default in Next.js
```

### Lazy load below-fold components:
```tsx
import dynamic from "next/dynamic"
const HeavyComponent = dynamic(() => import("@/components/HeavyComponent"), { loading: () => <Skeleton /> })
```

### Use next/dynamic for the calculator result page (it has animations):
```tsx
const Step5Result = dynamic(() => import("@/components/calculator/Step5Result"), {
  loading: () => <div className="animate-pulse h-96 bg-gray-100 rounded-xl" />,
})
```

## 7. Bundle Analysis

```bash
npm install -D @next/bundle-analyzer
```

Add to `next.config.ts`:
```ts
const withBundleAnalyzer = require("@next/bundle-analyzer")({ enabled: process.env.ANALYZE === "true" })
module.exports = withBundleAnalyzer(nextConfig)
```
