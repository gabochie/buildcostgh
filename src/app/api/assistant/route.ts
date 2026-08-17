import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { getLlmFaqs } from "@/lib/seo/faqs"

const SYSTEM_PROMPT = `You are BuildCost GH, an expert assistant on construction costs in Ghana. You help homeowners, builders, and the diaspora understand building costs, materials, permits, contractors, and the construction process in Ghana.

Key facts:
- 2-bedroom house: GHS 250,000–900,000
- 3-bedroom house: GHS 400,000–1,500,000
- 4-bedroom house: GHS 600,000–2,500,000
- 5-bedroom luxury: GHS 900,000–3,500,000
- Cement: GHS 87–116/bag
- Building permit: GHS 1,700–5,500
- Accra is 1.0x baseline, Kumasi 0.85x, Takoradi 0.80x

Always be helpful and concise. If unsure, say so. Direct users to the calculator at /calculator for personalized estimates and to /blog for detailed guides. Never make up specific prices — use ranges.`

function buildFaqContext(): string {
  const faqs = getLlmFaqs()
  return faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n")
}

async function callGroq(message: string): Promise<string | null> {
  const key = process.env.GROQ_API_KEY
  if (!key) return null
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + "\n\nReference FAQ:\n" + buildFaqContext() },
          { role: "user", content: message },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch {
    return null
  }
}

async function callCerebras(message: string): Promise<string | null> {
  const key = process.env.CEREBRAS_API_KEY
  if (!key) return null
  try {
    const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + "\n\nReference FAQ:\n" + buildFaqContext() },
          { role: "user", content: message },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch {
    return null
  }
}

async function callWorkersAI(message: string): Promise<string | null> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN
  if (!accountId || !apiToken) return null
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.2-3b-instruct`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: SYSTEM_PROMPT + "\n\nReference FAQ:\n" + buildFaqContext() },
            { role: "user", content: message },
          ],
          max_tokens: 500,
          temperature: 0.3,
        }),
      },
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.result?.response || null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const limit = await checkRateLimit(ip, { maxAttempts: 20, windowMs: 60000, useDb: false })
    if (!limit.allowed) {
      return NextResponse.json({ error: limit.message || "Too many requests" }, { status: 429 })
    }

    const { message } = await request.json()
    if (!message || typeof message !== "string") {
      return NextResponse.json({ answer: "Please ask a question about construction costs in Ghana." })
    }

    const llmAnswer = await callWorkersAI(message) || await callGroq(message) || await callCerebras(message)
    if (llmAnswer) {
      return NextResponse.json({ answer: llmAnswer })
    }

    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { title: true, excerpt: true, slug: true },
    })

    const q = message.toLowerCase()
    const relevant = posts
      .map((p) => {
        const titleScore = p.title.toLowerCase().includes(q) ? 3 : 0
        const excerptScore = (p.excerpt || "").toLowerCase().includes(q) ? 2 : 0
        const wordScore = q.split(" ").filter((w) => w.length > 3 && p.title.toLowerCase().includes(w)).length
        return { ...p, score: titleScore + excerptScore + wordScore }
      })
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    if (relevant.length > 0) {
      const top = relevant[0]
      return NextResponse.json({
        answer: `I found a related article: "${top.title}". ${top.excerpt || ""} You can read the full article at /blog/${top.slug}. For a more specific answer, try rephrasing your question or use our calculator for a personalized cost estimate.`,
      })
    }

    return NextResponse.json({
      answer: "I am not sure about that. Try asking about house costs, material prices, building steps, or regional costs. You can also use our calculator for a personalized estimate or browse the blog for detailed guides.",
    })
  } catch {
    return NextResponse.json({ answer: "Sorry, something went wrong. Please try again." })
  }
}
