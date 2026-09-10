import OpenAI from "openai"
import type { SubagentSpec } from "@/lib/cofounder/subagents"
import { cofounderToolMap } from "@/lib/cofounder/tools"

/**
 * Core agent loop for the AI Cofounder.
 *
 * Runs OpenAI chat.completions with function calling over the cofounder
 * tool registry. Every assistant turn is streamed; tool calls are executed
 * server-side and fed back for up to MAX_TOOL_ROUNDS before the final
 * answer is streamed to the client via the `emit` callback (SSE events).
 */

export const COFOUNDER_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini"

const MAX_TOOL_ROUNDS = 6

export type CofounderEvent =
  | { type: "activity"; message: string }
  | { type: "delta"; text: string }
  | { type: "tool_start"; name: string; args: string }
  | { type: "tool_end"; name: string; result: string; ok: boolean }
  | { type: "done"; text: string }
  | { type: "error"; message: string }

type ChatTurn = { role: "user" | "assistant"; content: string }

// ═══════════════════════════════════════════════════════════
// LLM PROVIDER SELECTION
// ═══════════════════════════════════════════════════════════
// The agents prefer OpenAI when OPENAI_API_KEY is set, else fall back to
// GROQ or Cerebras (both OpenAI-compatible chat APIs) so content generation
// and the cofounder keep working with any one LLM key configured.
// ═══════════════════════════════════════════════════════════

export type LLMProvider = "openai" | "groq" | "cerebras"

const PROVIDER_CONFIG: Record<LLMProvider, { baseURL?: string; defaultModel: string }> = {
  openai: { baseURL: undefined, defaultModel: "gpt-4o-mini" },
  groq: { baseURL: "https://api.groq.com/openai/v1", defaultModel: "llama-3.3-70b-versatile" },
  cerebras: { baseURL: "https://api.cerebras.ai/v1", defaultModel: "llama-3.3-70b" },
}

export function activeLLMProvider(): LLMProvider | null {
  if (process.env.OPENAI_API_KEY) return "openai"
  if (process.env.GROQ_API_KEY) return "groq"
  if (process.env.CEREBRAS_API_KEY) return "cerebras"
  return null
}

export function llmConfigured(): boolean {
  return activeLLMProvider() !== null
}

/**
 * OpenAI-compatible chat client for the active provider. Used for text
 * generation (content batches, subagents, cofounder chat). Image generation
 * stays OpenAI-exclusive via getOpenAiClient().
 */
export function getLLMClient(): OpenAI {
  const provider = activeLLMProvider() ?? "openai"
  const cfg = PROVIDER_CONFIG[provider]
  const apiKey =
    provider === "openai" ? process.env.OPENAI_API_KEY :
    provider === "groq" ? process.env.GROQ_API_KEY :
    process.env.CEREBRAS_API_KEY
  return new OpenAI({ apiKey, baseURL: cfg.baseURL })
}

export function getCurrentModel(): string {
  if (process.env.OPENAI_MODEL) return process.env.OPENAI_MODEL
  const provider = activeLLMProvider() ?? "openai"
  return PROVIDER_CONFIG[provider].defaultModel
}

/**
 * OpenAI-exclusive client (images, dall-e). Keep using getLLMClient() for
 * chat/text so GROQ/Cerebras fallbacks kick in.
 */
export function getOpenAiClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export function getCofounderSystemPrompt(): string {
  return `You are the AI Cofounder of BuildCostGH, a Ghanaian construction-cost platform (buildcostgh.com).

MISSION
Drive BuildCostGH to $1,000,000 USD in revenue within 12 months. You act as a strategic
cofounder: you know the entire business (revenue, orders, leads, messages, subscribers,
blog content, pricing) and you lead a team of specialist subagents.

BUSINESS FACTS
- Products: Free Trial ($0), Basic Report ($29 USD), Detailed Report ($79 USD), Premium Report ($199 USD).
- Payments via MTN MoMo (mobile money) billed in GHS; diaspora pays in USD.
- Customers: Ghanaians at home and in the diaspora planning to build in Ghana.
- You have live tools: get_business_state, get_goal_state, get_cost_estimate, get_lead_score,
  list_orders, list_blog_posts, get_market_pricing, delegate_task.

HOW TO WORK
1. Ground every answer in the real numbers — call get_business_state or get_goal_state before
   making claims about revenue, orders, or progress.
2. Use get_cost_estimate for any construction pricing question, get_lead_score before
   recommending outreach, list_orders when discussing sales.
3. Delegate deep specialist work to subagents (SDR, Content, Pricing, Research, Ops) via
   delegate_task. You are the conductor — subagents do the focused work.
4. Be a proactive cofounder: spot bottlenecks, propose concrete next actions with expected
   impact, and track progress toward the $1M goal.

HARD RULES
- You may DRAFT emails and copy, but you NEVER send emails, make purchases, change prices,
  deploy, or touch payment data. Everything external requires founder approval.
- Never invent revenue or order numbers. If you don't know, call a tool.
- Be concise and direct. Use bullets. No fluff, no emojis.
- Reply in the same language the founder uses (English or Twi).`
}

type StreamedToolCall = { id: string; name: string; args: string }

function openAiTools() {
  return cofounderToolsToOpenAi()
}

function cofounderToolsToOpenAi() {
  return [...cofounderToolMap.values()].map((t) => ({
    type: "function" as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }))
}

/**
 * Run one cofounder chat turn with the tool loop. Streams SSE-style events
 * via `emit` and returns the final assistant text.
 */
export async function runCofounderChat(params: {
  messages: ChatTurn[]
  emit: (event: CofounderEvent) => void
}): Promise<string> {
  const { messages, emit } = params
  const openai = getLLMClient()

  const history: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: getCofounderSystemPrompt() },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ]

  let finalText = ""

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let streamedText = ""
    const toolCalls = new Map<number, StreamedToolCall>()

    const stream = await openai.chat.completions.create({
      model: getCurrentModel(),
      messages: history,
      tools: openAiTools(),
      tool_choice: "auto",
      stream: true,
    })

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta
      if (delta?.content) {
        streamedText += delta.content
        emit({ type: "delta", text: delta.content })
      }
      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index
          const existing = toolCalls.get(idx) ?? { id: "", name: "", args: "" }
          if (tc.id) existing.id = tc.id
          if (tc.function?.name) existing.name += tc.function.name
          if (tc.function?.arguments) existing.args += tc.function.arguments
          toolCalls.set(idx, existing)
        }
      }
    }

    if (toolCalls.size === 0) {
      // Final answer (no more tools requested).
      finalText = streamedText
      emit({ type: "done", text: finalText })
      return finalText
    }

    // Push assistant message with tool calls into history.
    const assistantToolCalls: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "assistant",
        content: streamedText || null,
        tool_calls: [...toolCalls.values()].map((tc, i) => ({
          id: tc.id || `call_${i}`,
          type: "function" as const,
          function: { name: tc.name, arguments: tc.args || "{}" },
        })),
      },
    ]
    history.push(...assistantToolCalls)

    // Execute each tool and append results.
    for (const [, tc] of toolCalls) {
      emit({ type: "tool_start", name: tc.name, args: tc.args })

      let output: string
      let ok = true
      try {
        const tool = cofounderToolMap.get(tc.name)
        if (!tool) {
          output = `Unknown tool: ${tc.name}`
          ok = false
        } else {
          let argsObj: Record<string, unknown>
          try {
            argsObj = JSON.parse(tc.args || "{}")
          } catch {
            argsObj = {}
          }
          output = await tool.execute(argsObj)
        }
      } catch (err) {
        output = `Tool error: ${err instanceof Error ? err.message : String(err)}`
        ok = false
      }

      emit({ type: "tool_end", name: tc.name, result: output, ok })

      history.push({
        role: "tool",
        tool_call_id: tc.id,
        content: output,
      })
    }
  }

  // Hit the tool-round cap without a final answer — summarize what happened.
  const timeoutMessage =
    "I've reached the maximum number of reasoning steps for this turn. Here's where things stand — let me know how you'd like to continue."
  emit({ type: "error", message: timeoutMessage })
  return timeoutMessage
}

/**
 * One-shot delegated task execution for a specialist subagent.
 * Used by the delegate_task tool. Returns the subagent's text output.
 */
export async function runSubagent(spec: SubagentSpec, taskPrompt: string): Promise<string> {
  const openai = getLLMClient()
  const completion = await openai.chat.completions.create({
    model: getCurrentModel(),
    messages: [
      { role: "system", content: spec.role },
      { role: "user", content: taskPrompt },
    ],
    max_tokens: spec.maxTokens,
  })

  const text = completion.choices[0]?.message?.content?.trim() ?? ""
  if (!text) throw new Error("Subagent returned an empty response")
  return text
}

export function openAiConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY
}
