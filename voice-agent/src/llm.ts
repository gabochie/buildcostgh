export interface Env {
  AI: Ai;
  GROQ_API_KEY?: string;
  CEREBRAS_API_KEY?: string;
  BuildCostVoiceAgent: DurableObjectNamespace;
}

interface ChatMessage {
  role: string;
  content: string;
}

async function callOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  maxTokens: number,
  signal?: AbortSignal
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "unknown");
    throw new Error(`${res.status}: ${errText}`);
  }

  const data = (await res.json()) as any;
  return data.choices?.[0]?.message?.content ?? "";
}

async function callWorkersAI(
  ai: Ai,
  messages: ChatMessage[],
  maxTokens: number,
  signal?: AbortSignal
): Promise<string> {
  const response = await ai.run("@cf/meta/llama-3.2-3b-instruct", {
    messages,
    max_tokens: maxTokens,
  });
  return (response as any).response ?? "";
}

const GROQ_MODEL = "llama-3.3-70b-versatile";
const CEREBRAS_MODEL = "llama-3.3-70b";

export async function generateWithFallback(
  env: Env,
  systemPrompt: string,
  messages: ChatMessage[],
  maxTokens: number = 512,
  signal?: AbortSignal
): Promise<string> {
  const allMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  try {
    const result = await callWorkersAI(env.AI, allMessages, maxTokens, signal);
    if (result) return result;
  } catch (e: any) {
    console.warn("[LLM] Workers AI failed:", e.message?.substring(0, 200));
  }

  if (env.GROQ_API_KEY) {
    try {
      const result = await callOpenAICompatible(
        "https://api.groq.com/openai/v1",
        env.GROQ_API_KEY,
        GROQ_MODEL,
        allMessages,
        maxTokens,
        signal
      );
      if (result) return result;
    } catch (e: any) {
      console.warn("[LLM] Groq failed:", e.message?.substring(0, 200));
    }
  }

  if (env.CEREBRAS_API_KEY) {
    try {
      const result = await callOpenAICompatible(
        "https://api.cerebras.ai/v1",
        env.CEREBRAS_API_KEY,
        CEREBRAS_MODEL,
        allMessages,
        maxTokens,
        signal
      );
      if (result) return result;
    } catch (e: any) {
      console.warn("[LLM] Cerebras failed:", e.message?.substring(0, 200));
    }
  }

  return "I'm sorry, the voice assistant is temporarily unavailable. Please try again in a moment or visit buildcostgh.com for instant cost estimates.";
}
