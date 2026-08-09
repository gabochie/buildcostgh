import { Agent, routeAgentRequest } from "agents";
import {
  withVoice,
  WorkersAIFluxSTT,
  WorkersAITTS,
  type VoiceTurnContext,
} from "@cloudflare/voice";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { SYSTEM_PROMPT } from "./knowledge";

export interface Env {
  AI: Ai;
  OPENAI_API_KEY: string;
  OPENAI_MODEL?: string;
  BuildCostVoiceAgent: DurableObjectNamespace;
}

const VoiceAgent = withVoice(Agent, {
  historyLimit: 20,
  audioFormat: "mp3",
  maxMessageCount: 1000,
});

export class BuildCostVoiceAgent extends VoiceAgent<Env> {
  transcriber = new WorkersAIFluxSTT(this.env.AI);
  tts = new WorkersAITTS(this.env.AI);

  async onTurn(transcript: string, context: VoiceTurnContext) {
    if (!this.env.OPENAI_API_KEY) {
      return "Sorry, the voice assistant is not configured yet. Please check back soon.";
    }

    const openai = createOpenAI({ apiKey: this.env.OPENAI_API_KEY });

    const result = streamText({
      model: openai(this.env.OPENAI_MODEL ?? "gpt-4o-mini"),
      system: SYSTEM_PROMPT,
      messages: [
        ...context.messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: transcript },
      ],
      abortSignal: context.signal,
    });

    return result.textStream;
  }
}

export default {
  fetch: async (request: Request, env: Env, ctx: ExecutionContext) =>
    (await routeAgentRequest(request, env)) ?? new Response("Not found", { status: 404 }),
};
