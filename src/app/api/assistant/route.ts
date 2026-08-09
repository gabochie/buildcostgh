import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"

const faq: Record<string, string> = {
  "how much does it cost to build a house in ghana":
    "A 2-bedroom house costs GHS 250,000–900,000 depending on finish. A 3-bedroom costs GHS 400,000–1,500,000. A 4-bedroom costs GHS 600,000–2,500,000. A 5-bedroom luxury home costs GHS 900,000–3,500,000. Use our calculator for a precise estimate.",
  "how much does a 2 bedroom house cost":
    "A 2-bedroom house in Ghana costs GHS 250,000–400,000 for basic finish, GHS 400,000–650,000 for standard, and GHS 650,000–900,000 for premium finish.",
  "how much does a 3 bedroom house cost":
    "A 3-bedroom house in Ghana costs GHS 400,000–650,000 for basic finish, GHS 650,000–1,000,000 for standard, and GHS 1,000,000–1,500,000 for premium finish.",
  "how much does a 4 bedroom house cost":
    "A 4-bedroom house in Ghana costs GHS 600,000–900,000 for basic finish, GHS 900,000–1,400,000 for standard, and GHS 1,400,000–2,500,000 for premium finish.",
  "how much does a 5 bedroom house cost":
    "A 5-bedroom house costs GHS 900,000–1,300,000 for basic, GHS 1,300,000–2,000,000 for standard, and GHS 2,000,000–3,500,000 for premium finish.",
  "what is the cost of land in ghana":
    "Land prices vary widely by location. East Legon: GHS 300,000–1,000,000+ per plot. Kasoa: GHS 60,000–150,000. Kumasi: GHS 80,000–250,000. Takoradi: GHS 70,000–200,000. Emerging areas like Dodowa: GHS 40,000–100,000.",
  "how much does cement cost in ghana":
    "Cement prices in 2026: Bright 32.5 is GHS 87/bag, GASM 42.5 is GHS 116/bag, Diamond Cement is GHS 82/bag. Prices vary by region and supplier.",
  "how much do building materials cost":
    "Key material prices: Cement GHS 87–116/bag, Iron rods GHS 70–90 each (12mm), Blocks GHS 8–15 each, Roofing sheets GHS 45–70/SQM, Sand GHS 3,000–5,000 per trip.",
  "how much does foundation cost":
    "A standard strip foundation for a 3-bedroom house costs GHS 80,000–120,000. This includes excavation, blinding, reinforcement, block work, and damp proofing.",
  "how much does roofing cost":
    "Roofing costs range from GHS 50,000–150,000. Aluminium sheets: GHS 45–55/SQM. Metac sheets: GHS 55–70/SQM. Stone-coated tiles: GHS 120–180/SQM.",
  "how to build a house in ghana":
    "Step 1: Plan and budget using our calculator. Step 2: Buy land and verify ownership. Step 3: Get architectural drawings and building permit. Step 4: Hire a contractor. Step 5: Build in phases — foundation, structure, roofing, finishing. See our step-by-step guide on the blog.",
  "diaspora build from abroad":
    "For diaspora builders: Hire a local project manager, grant power of attorney to a trusted person, use milestone-based payments, require weekly video updates, and visit during critical stages. See our Diaspora Guide on the blog.",
  "building permit cost":
    "Building permit fees in Ghana: Application fee GHS 1,000–3,000, inspection fee GHS 500–2,000, plan registration GHS 200–500. Total: GHS 1,700–5,500. Timeline: 4-12 weeks.",
  "contractor vs diy":
    "Hiring a contractor adds 15-25% to costs but saves time and stress. DIY saves the contractor fee but requires full-time commitment. A hybrid approach — hire for foundation/roofing, manage finishing yourself — is often the best choice.",
  "hidden costs of building":
    "Hidden costs include: Land documentation GHS 2,000–5,000, building permit GHS 1,000–3,000, architectural drawings GHS 5,000–15,000, utility connections GHS 3,000–15,000, fence wall GHS 15,000–50,000. Always budget 15-20% contingency.",
  "how long does it take to build":
    "2-bedroom: 4-8 months. 3-bedroom: 6-10 months. 4-bedroom: 8-14 months. 5-bedroom+: 10-18 months. Delays are usually caused by funding gaps, material availability, and rainy season.",
  "cost to build in accra":
    "Building in Accra costs 1.0x the baseline. A 3-bedroom standard house costs GHS 650,000–1,000,000. East Legon and Airport areas command a premium of 1.6x.",
  "cost to build in kumasi":
    "Building in Kumasi costs about 0.85x of Accra prices. A 3-bedroom standard house costs GHS 550,000–850,000. Labour and materials are generally more affordable.",
  "cost to build in takoradi":
    "Building in Takoradi costs about 0.80x of Accra prices. A 3-bedroom standard house costs GHS 500,000–780,000.",
  "how to choose a contractor":
    "Get referrals from friends who built recently. Check GREDA or ABCEC registration. Get itemized quotes from at least 3 contractors. Check references from previous clients. Always sign a detailed contract with payment milestones.",
  "flood resilient construction":
    "After the June 2026 floods: build on elevated foundations at least 1m above flood level, install perimeter drains, use waterproof cement additives, and avoid building in flood-prone areas. See our flood-resilient construction guide.",
  "what is a boq":
    "A Bill of Quantities (BoQ) lists every material, quantity, and cost for your project. It helps you compare contractor quotes and track your budget. Verify quantities against your house plans and rates against market prices.",
  "solar power cost ghana":
    "Basic solar system (lights, TV, phones): GHS 8,000–15,000. Standard (full home, no AC): GHS 20,000–40,000. Premium (full home with AC): GHS 50,000–120,000. Payback period: 3-5 years.",
  "rental property investment":
    "Student areas (Legon, Kumasi, Cape Coast): 10-15% returns. Urban middle-income areas: 8-12%. Premium areas: 5-8% with higher capital appreciation. A 2-bedroom unit costs GHS 300,000–500,000 and rents for GHS 1,500–2,500/month.",
  "hello": "Hello! I'm the BuildCost GH assistant. Ask me anything about construction costs, building materials, or building a house in Ghana.",
  "hi": "Hi there! How can I help you with your construction project in Ghana? Try asking about costs, materials, or the building process.",
  "help": "I can answer questions about: house costs by size, material prices, land prices, regional cost comparisons, building permits, contractor selection, diaspora building, flood-resilient construction, and more. Try asking a specific question!",
}

function findBestAnswer(query: string): { answer: string; source?: string } | null {
  const q = query.toLowerCase().trim()

  const exactMatch = faq[q]
  if (exactMatch) return { answer: exactMatch }

  for (const [key, answer] of Object.entries(faq)) {
    const keyWords = key.split(" ")
    const matchCount = keyWords.filter((w) => q.includes(w)).length
    if (matchCount >= Math.min(3, keyWords.length)) {
      return { answer }
    }
  }

  for (const [key, answer] of Object.entries(faq)) {
    const keyWords = key.split(" ")
    const matchCount = keyWords.filter((w) => q.includes(w)).length
    if (matchCount >= 2) {
      return { answer }
    }
  }

  return null
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

    const faqAnswer = findBestAnswer(message)
    if (faqAnswer) {
      return NextResponse.json({ answer: faqAnswer.answer })
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
