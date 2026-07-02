import { prisma } from "@/lib/prisma"

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://buildcostgh.com"

  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const items = posts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/blog/${post.slug}</link>
      <guid>${baseUrl}/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt || ""}]]></description>
      <pubDate>${post.createdAt.toUTCString()}</pubDate>
      <author>${post.author}</author>
      ${post.imageUrl ? `<enclosure url="${baseUrl}${post.imageUrl}" type="image/jpeg" />` : ""}
    </item>`
    )
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>BuildCost GH Blog - Ghana Construction Insights</title>
    <link>${baseUrl}/blog</link>
    <description>Expert articles on construction costs, materials, permits, and building strategies in Ghana</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
