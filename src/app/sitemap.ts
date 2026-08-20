import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"
import { services } from "@/lib/services"

export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://buildcostgh.com"

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/calculator`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/how-it-works`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/costs`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/contractors`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/flood-safe-land`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/reports/flood-risk`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/api-pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/api-docs`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/affiliates`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/authors`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/careers`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/investors`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ]

  const servicePages: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${baseUrl}/services/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))

  try {
    const [posts, contractors, rates, buildingCategories] = await Promise.all([
      prisma.blogPost.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.contractor.findMany({
        where: { status: "active" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.regionRate.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.buildingCategory.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
    ])

    const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))

    const contractorPages: MetadataRoute.Sitemap = contractors.map((c) => ({
      url: `${baseUrl}/contractors/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }))

    const regionPages: MetadataRoute.Sitemap = rates.map((r) => ({
      url: `${baseUrl}/costs/${r.slug}`,
      lastModified: r.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))

    const buildingTypePages: MetadataRoute.Sitemap = buildingCategories.map((cat) => ({
      url: `${baseUrl}/building-types/${cat.slug}`,
      lastModified: cat.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }))

    const redirectPages: MetadataRoute.Sitemap = [
      { url: `${baseUrl}/commercial-building-cost-calculator`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
      { url: `${baseUrl}/residential-building-cost-calculator`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
      { url: `${baseUrl}/hospital-building-cost-calculator`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
      { url: `${baseUrl}/school-building-cost-calculator`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
      { url: `${baseUrl}/factory-building-cost-calculator`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
      { url: `${baseUrl}/warehouse-building-cost-calculator`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
      { url: `${baseUrl}/hotel-building-cost-calculator`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
      { url: `${baseUrl}/industrial-building-cost-calculator`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
      { url: `${baseUrl}/office-building-cost-calculator`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    ]

    return [...staticPages, ...servicePages, ...buildingTypePages, ...redirectPages, ...blogPages, ...contractorPages, ...regionPages]
  } catch {
    return [...staticPages, ...servicePages]
  }
}
