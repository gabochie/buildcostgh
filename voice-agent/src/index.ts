import { Agent, routeAgentRequest, type Connection } from "agents";
import {
  withVoice,
  WorkersAINova3STT,
  WorkersAITTS,
  type VoiceTurnContext,
} from "@cloudflare/voice";
import { streamText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { SYSTEM_PROMPT } from "./knowledge";

export interface Env {
  AI: Ai;
  OPENAI_API_KEY: string;
  OPENAI_MODEL?: string;
  BuildCostVoiceAgent: DurableObjectNamespace;
}

type VoiceState = { userName?: string };

const VoiceAgent = withVoice(Agent, {
  historyLimit: 20,
  audioFormat: "mp3",
  maxMessageCount: 1000,
});

export class BuildCostVoiceAgent extends VoiceAgent<Env> {
  transcriber = new WorkersAINova3STT(this.env.AI);
  tts = new WorkersAITTS(this.env.AI);

  async onCallStart(connection: Connection) {
    const state = this.state as VoiceState;
    const greeting = state.userName
      ? `Welcome back, ${state.userName}! I'm your BuildCost GH assistant. How can I help you today?`
      : "Welcome to BuildCost GH! I'm your construction cost assistant. What's your name?";
    await this.speak(connection, greeting);
  }

  async onTurn(transcript: string, context: VoiceTurnContext) {
    console.log("[onTurn] OPENAI_API_KEY present:", !!this.env.OPENAI_API_KEY, "length:", this.env.OPENAI_API_KEY?.length);
    console.log("[onTurn] env keys:", Object.keys(this.env));
    if (!this.env.OPENAI_API_KEY) {
      return "Sorry, the voice assistant is not configured yet. Please check back soon.";
    }

    const openai = createOpenAI({ apiKey: this.env.OPENAI_API_KEY });
    const state = this.state as VoiceState;

    const systemPrompt =
      SYSTEM_PROMPT +
      (state.userName
        ? `\n\nThe caller's name is ${state.userName}. Greet them by name and use it naturally in conversation.`
        : `\n\n# Personalization\n- If you don't know the caller's name, ask warmly: "What's your name?"\n- When they share their name, IMMEDIATELY call the saveUserName tool with their first name.\n- Use their name naturally in conversation (e.g., "Great question, Kwame!" or "Let me help you with that, Ama.").`);

    const result = streamText({
      model: openai(this.env.OPENAI_MODEL ?? "gpt-4o-mini"),
      system: systemPrompt,
      tools: {
        saveUserName: tool({
          description:
            "Save the user's name when they introduce themselves. Only call once per session.",
          inputSchema: z.object({
            name: z.string().describe("The user's first name"),
          }),
          execute: async (input) => {
            this.setState({ userName: input.name } as VoiceState);
            return `Name saved: ${input.name}`;
          },
        }),
      },
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
