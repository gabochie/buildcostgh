import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, User, Shield, CheckCircle } from "lucide-react"
import { readingTime } from "@/lib/utils"
import { ShareButtons } from "@/components/shared/ShareButtons"
import { FaqSection } from "@/components/shared/FaqSection"
import { HelpfulWidget } from "@/components/shared/HelpfulWidget"
import { AdUnit } from "@/components/shared/AdUnit"

export const dynamic = "force-dynamic"

type FaqItem = { question: string; answer: string }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.blogPost.findUnique({ where: { slug } })
  if (!post) return {}
  const tags = (() => {
    try { return JSON.parse(post.tags) as string[] } catch { return [] }
  })()
  return {
    title: `${post.title} - BuildCost GH Blog`,
    description: post.excerpt || "",
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    keywords: tags,
    openGraph: {
      title: post.title,
      description: post.excerpt || "",
      type: "article",
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
      authors: [post.author],
      section: post.category ?? undefined,
      images: post.imageUrl ? [{ url: post.imageUrl }] : [],
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await prisma.blogPost.findUnique({ where: { slug } })

  if (!post || !post.published) notFound()

  const tags = (() => {
    try { return JSON.parse(post.tags) as string[] } catch { return [] }
  })()

  const faqItems: FaqItem[] = (() => {
    try { return JSON.parse(post.faqJson || "[]") } catch { return [] }
  })()

  const relatedPosts = tags.length > 0
    ? await prisma.blogPost.findMany({
        where: {
          published: true,
          slug: { not: post.slug },
          OR: tags.map((tag) => ({ tags: { contains: tag } })),
        },
        take: 3,
        orderBy: { createdAt: "desc" },
      })
    : []

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://buildcostgh.com"
  const authorBio = post.authorBio || "Construction cost analysts helping Ghanaians and the diaspora build smarter homes."

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Blog
        </Link>

        <article>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": post.schemaType === "FAQPage" ? "FAQPage" : "Article",
                mainEntityOfPage: {
                  "@type": "WebPage",
                  "@id": `${baseUrl}/blog/${post.slug}`,
                },
                headline: post.title,
                description: post.excerpt,
                image: post.imageUrl ? `${baseUrl}${post.imageUrl}` : undefined,
                datePublished: post.createdAt.toISOString(),
                dateModified: post.updatedAt?.toISOString(),
                author: {
                  "@type": "Person",
                  name: post.author,
                  url: `${baseUrl}/authors`,
                },
                publisher: {
                  "@type": "Organization",
                  name: "BuildCost GH",
                  url: `${baseUrl}/`,
                  logo: { "@type": "ImageObject", url: `${baseUrl}/brand/logo-primary-1200w.png` },
                },
                inLanguage: "en",
                articleSection: post.category ?? undefined,
                keywords: tags.length > 0 ? tags : undefined,
                ...(faqItems.length > 0 && {
                  mainEntity: faqItems.map((faq) => ({
                    "@type": "Question",
                    name: faq.question,
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: faq.answer,
                    },
                  })),
                }),
              }),
            }}
          />
          {post.imageUrl && (
            <div className="aspect-video rounded-xl overflow-hidden mb-8">
              <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-400 mb-4">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(post.createdAt).toLocaleDateString("en-GH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.readTimeMin ? `${post.readTimeMin} min read` : readingTime(post.content)}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {post.author}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
              {post.category?.replace(/-/g, " ")}
            </span>
            {tags.length > 0 && tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full"
              >
                {tag.replace(/-/g, " ")}
              </span>
            ))}
          </div>

          <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />

          {faqItems.length > 0 && <FaqSection items={faqItems} />}

          <ShareButtons url={`${baseUrl}/blog/${post.slug}`} title={post.title} />

          <div className="mt-10 p-5 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link href="/authors" className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg flex-shrink-0 hover:opacity-90 transition-opacity">
                {post.author.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </Link>
              <div className="flex-1">
                <Link href="/authors" className="font-semibold text-gray-900 text-sm hover:text-emerald-600">{post.author}</Link>
                <p className="text-xs text-gray-500 mt-0.5">{authorBio}</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-gray-500">
                <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-600" /> Fact-checked</span>
                <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-emerald-600" /> Trusted info</span>
              </div>
            </div>
          </div>

          <HelpfulWidget />
        </article>

        <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_AD_SLOT_BLOG ?? ""} />

        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-charcoal text-center shadow-lg">
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-white mb-2">
              Ready to Estimate Your Build Cost?
            </h3>
            <p className="text-emerald-100/70 text-sm mb-5 max-w-md mx-auto">
              Get a detailed cost breakdown for your dream home in minutes — free, no card required.
            </p>
            <Link
              href="/calculator"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-charcoal font-bold hover:bg-gold/90 transition-all shadow-lg shadow-gold/25"
            >
              Start Your Free Estimate <ArrowLeft className="h-4 w-4 rotate-180" />
            </Link>
          </div>
        </div>

        {relatedPosts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/blog/${rp.slug}`}
                  className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {rp.imageUrl && (
                    <div className="aspect-video bg-gray-100 overflow-hidden">
                      <img src={rp.imageUrl} alt={rp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-sm text-gray-400 mb-1">{rp.readTimeMin ? `${rp.readTimeMin} min read` : readingTime(rp.content)}</p>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2">
                      {rp.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-emerald-600 font-medium hover:text-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" /> View All Articles
          </Link>
        </div>
      </div>
    </div>
  )
}
