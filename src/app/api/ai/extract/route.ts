import { NextResponse } from "next/server"
import { z } from "zod"
import { AI_EXTRACTION_PROMPT, EstimateRequestSchema, validateEstimateRequest } from "@/lib/ai-readiness"

const INPUT_SCHEMA = z.object({
  text: z.string().min(10, "Description must be at least 10 characters").max(500),
})

async function callWorkersAI(prompt: string, input: string): Promise<string | null> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN
  if (!accountId || !apiToken) return null

  const model = "@cf/meta/llama-3.1-8b-instruct"
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: input },
          ],
          max_tokens: 512,
          temperature: 0.1,
          stream: false,
        }),
      }
    )
    if (!res.ok) return null
    const data = await res.json() as { result?: { response?: string } }
    return data?.result?.response || null
  } catch {
    return null
  }
}

async function callGroq(prompt: string, input: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: input },
        ],
        max_tokens: 512,
        temperature: 0.1,
      }),
    })
    if (!res.ok) return null
    const data = await res.json() as { choices?: { message?: { content?: string } }[] }
    return data?.choices?.[0]?.message?.content || null
  } catch {
    return null
  }
}

function extractJson(text: string): Record<string, unknown> | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = INPUT_SCHEMA.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    let raw: string | null = null
    raw = await callWorkersAI(AI_EXTRACTION_PROMPT, parsed.data.text)
    if (!raw) raw = await callGroq(AI_EXTRACTION_PROMPT, parsed.data.text)
    if (!raw) {
      return NextResponse.json(
        { error: "AI service unavailable. Please fill in the calculator form manually." },
        { status: 503 }
      )
    }

    const extracted = extractJson(raw)
    if (!extracted) {
      return NextResponse.json(
        { error: "Could not parse AI response. Please try again or fill in the form manually." },
        { status: 422 }
      )
    }

    const validation = validateEstimateRequest(extracted)
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        partial: extracted,
        errors: validation.errors,
        suggestion: "Some fields could not be extracted. Please complete the missing fields in the calculator.",
      })
    }

    return NextResponse.json({
      success: true,
      parameters: validation.data,
      raw: extracted,
    })
  } catch (error) {
    return NextResponse.json({ error: "AI extraction failed" }, { status: 500 })
  }
}
