import { PrismaClient } from "@prisma/client"
import { posts as batchA } from "./posts-batch-a"
import { posts as batchB } from "./posts-batch-b"
import { posts as batchC } from "./posts-batch-c"

const prisma = new PrismaClient()

const AUTHOR = "BuildCostGH Research Team"

function wordCount(html: string): number {
  return html.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length
}

const posts = [...batchA, ...batchB, ...batchC]

async function main() {
  console.log("Starting blog content batch 3 update... (" + posts.length + " posts)")

  for (const post of posts) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug } })
    if (!existing) {
      console.log(`Skipping ${post.slug} — not found in database`)
      continue
    }

    const wc = wordCount(post.content)

    await prisma.blogPost.update({
      where: { slug: post.slug },
      data: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        author: AUTHOR,
        authorBio: post.authorBio,
        faqJson: post.faqJson,
        schemaType: post.schemaType,
        category: post.category,
        tags: JSON.stringify(post.tags),
        readTimeMin: Math.max(1, Math.ceil(wc / 200)),
      },
    })

    console.log(`✓ Updated "${post.title}" (${wc} words, ${post.tags.length} tags, ${JSON.parse(post.faqJson).length} FAQs)`)
  }

  console.log("\nDone! Updated", posts.length, "blog posts.")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
