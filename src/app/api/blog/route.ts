import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api-auth"

export async function GET() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, slug: true, published: true, createdAt: true, author: true },
  })
  return NextResponse.json(posts)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!isAdmin(session?.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { title, slug, excerpt, content, imageUrl, published, tags, category, authorBio, faqJson, schemaType } = await request.json()

  if (!title || !slug || !content) {
    return NextResponse.json({ error: "Title, slug, and content required" }, { status: 400 })
  }

  const wordCount = content.replace(/<[^>]*>/g, "").split(/\s+/).length
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200))

  const post = await prisma.blogPost.create({
    data: {
      title,
      slug,
      excerpt: excerpt || null,
      content,
      imageUrl: imageUrl || null,
      author: session?.user?.name || "Admin",
      authorBio: authorBio || null,
      faqJson: JSON.stringify(faqJson || []),
      schemaType: schemaType || "Article",
      readTimeMin,
      published: published || false,
      category: category || "uncategorized",
      tags: JSON.stringify(tags || []),
    },
  })

  return NextResponse.json(post)
}
