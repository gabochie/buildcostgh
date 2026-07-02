import Link from "next/link"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { Calendar, ArrowRight, Clock } from "lucide-react"
import { readingTime } from "@/lib/utils"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Construction Cost Blog - BuildCost GH",
  description: "Tips, guides, and insights on construction costs in Ghana for Ghanaians and the global African diaspora. Learn how to budget, save money, and plan your dream home or investment.",
}

const POSTS_PER_PAGE = 9

const CATEGORIES = [
  { slug: "cost-guides", label: "Cost Guides" },
  { slug: "regional-guides", label: "Regional Guides" },
  { slug: "material-costs", label: "Material Costs" },
  { slug: "tips-advice", label: "Tips & Advice" },
  { slug: "ghana-floods", label: "Ghana Floods" },
  { slug: "foundation", label: "Foundation" },
  { slug: "roofing", label: "Roofing" },
  { slug: "finishing", label: "Finishing" },
  { slug: "diaspora", label: "Diaspora" },
  { slug: "news-updates", label: "News & Updates" },
]

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>
}) {
  const { page, category } = await searchParams
  const currentPage = Math.max(1, Number(page) || 1)
  const activeCategory = category || ""
  const skip = (currentPage - 1) * POSTS_PER_PAGE

  const where = { published: true, ...(activeCategory ? { category: activeCategory } : {}) }

  const [posts, total, categories] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: POSTS_PER_PAGE,
    }),
    prisma.blogPost.count({ where }),
    prisma.blogPost.groupBy({
      by: ["category"],
      where: { published: true },
      _count: true,
    }),
  ])

  const totalPages = Math.ceil(total / POSTS_PER_PAGE)
  const categoryCounts = Object.fromEntries(categories.map((c) => [c.category, c._count]))

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">BuildCost GH Blog</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tips, guides, and insights on construction costs in Ghana &mdash; {total} articles
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <Link
            href="/blog"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !activeCategory ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </Link>
          {CATEGORIES.filter((c) => categoryCounts[c.slug]).map((cat) => (
            <Link
              key={cat.slug}
              href={`/blog?category=${cat.slug}`}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.slug ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.label} ({categoryCounts[cat.slug]})
            </Link>
          ))}
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No articles in this category yet. Check back soon!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {post.imageUrl && (
                    <div className="aspect-video bg-gray-100 overflow-hidden">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                        {CATEGORIES.find((c) => c.slug === post.category)?.label || post.category?.replace(/-/g, " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.createdAt).toLocaleDateString("en-GH", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {readingTime(post.content)}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-gray-500 line-clamp-3">{post.excerpt}</p>
                    )}
                    <div className="mt-4 text-emerald-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read More <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                {currentPage > 1 && (
                  <Link
                    href={`/blog?page=${currentPage - 1}${activeCategory ? `&category=${activeCategory}` : ""}`}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={`/blog?page=${p}${activeCategory ? `&category=${activeCategory}` : ""}`}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      p === currentPage
                        ? "bg-emerald-600 text-white"
                        : "border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
                {currentPage < totalPages && (
                  <Link
                    href={`/blog?page=${currentPage + 1}${activeCategory ? `&category=${activeCategory}` : ""}`}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
