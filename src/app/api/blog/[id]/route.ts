import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api-auth"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await prisma.blogPost.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(post)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!isAdmin(session?.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const { title, slug, excerpt, content, imageUrl, published, tags, category, authorBio, faqJson, schemaType } = await request.json()

  const wordCount = (content || "").replace(/<[^>]*>/g, "").split(/\s+/).length
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200))

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      title,
      slug,
      excerpt: excerpt || null,
      content,
      imageUrl: imageUrl || null,
      published,
      category: category || "uncategorized",
      tags: JSON.stringify(tags || []),
      authorBio: authorBio || null,
      faqJson: faqJson !== undefined ? JSON.stringify(faqJson) : undefined,
      schemaType: schemaType || "Article",
      readTimeMin,
    },
  })

  return NextResponse.json(post)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!isAdmin(session?.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  await prisma.blogPost.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
