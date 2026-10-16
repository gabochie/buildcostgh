import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Slim `standalone` output only for Docker builds — Vercel uses its own
  // packaging and must not be affected.
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" as const } : {}),
  outputFileTracingRoot: import.meta.dirname,
  outputFileTracingIncludes: {
    "/api/content": ["./content/content-plan.json"],
    "/api/content/scheduled": ["./content/content-plan.json"],
    "/api/content/plan": ["./content/content-plan.json"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "ucarecdn.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, must-revalidate" }],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co https://www.googletagmanager.com https://cdn.jsdelivr.net https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
              "img-src 'self' data: blob: https:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://open.er-api.com https://api.coinbase.com https://api.paystack.co https://neon.tech wss://voice.buildcostgh.com https://www.google-analytics.com https://analytics.google.com https://www.google.com https://*.googletagmanager.com",
              "frame-src 'self' https://js.paystack.co https://challenges.cloudflare.com",
              "worker-src 'self'",
              "manifest-src 'self'",
            ].join("; "),
          },
        ],
      },
    ]
  },
}

export default nextConfig
