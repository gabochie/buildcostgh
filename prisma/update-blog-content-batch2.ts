import { PrismaClient } from "@prisma/client"
import posts6to10 from "./blog-posts-6-10"
import { posts as posts11to15 } from "./posts-11-15"

const prisma = new PrismaClient()

const AUTHOR = "BuildCostGH Research Team"

function wordCount(html: string): number {
  return html.replace(/<[^>]*>/g, "").split(/\s+/).filter(Boolean).length
}

const posts = [...posts6to10, ...posts11to15]

async function main() {
  console.log("Starting blog content batch 2 update...")

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
