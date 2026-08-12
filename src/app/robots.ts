import type { MetadataRoute } from "next"

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://buildcostgh.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/login", "/signup", "/dashboard"],
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: "anthropic-ai",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: "Claude-Web",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: "Google-CloudVertexBot",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: "CCBot",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: "Diffbot",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: "Applebot-Extended",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: "Bytespider",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: "Amazonbot",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: "cohere-ai",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
