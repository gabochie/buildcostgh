import { Agent, routeAgentRequest, type Connection } from "agents";
import {
  withVoice,
  WorkersAINova3STT,
  WorkersAITTS,
  type VoiceTurnContext,
} from "@cloudflare/voice";
import { generateWithFallback, type Env } from "./llm";
import { SYSTEM_PROMPT } from "./knowledge";

export type { Env } from "./llm";

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
    const state = (this.state ?? {}) as VoiceState;
    const greeting = state.userName
      ? `Welcome back, ${state.userName}! I'm your BuildCost GH assistant. How can I help you today?`
      : "Welcome to BuildCost GH! I'm your construction cost assistant. What's your name?";
    await this.speak(connection, greeting);
  }

  async onTurn(transcript: string, context: VoiceTurnContext) {
    const state = (this.state ?? {}) as VoiceState;

    const systemPrompt =
      SYSTEM_PROMPT +
      (state.userName
        ? `\n\nThe caller's name is ${state.userName}. Greet them by name and use it naturally in conversation.`
        : `\n\n# Personalization\n- If you don't know the caller's name, ask warmly: "What's your name?"\n- When they share their name, save it and use it naturally in conversation.`);

    const messages = [
      ...context.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: transcript },
    ];

    const text = await generateWithFallback(
      this.env,
      systemPrompt,
      messages,
      512,
      context.signal
    );

    if (!state.userName && /my name is|i'm |i am /i.test(transcript.toLowerCase())) {
      const nameMatch = transcript.match(/(?:my name is|i'm |i am )\s*(\w+)/i);
      if (nameMatch) {
        this.setState({ userName: nameMatch[1] } as VoiceState);
      }
    }

    return text;
  }
}

export default {
  fetch: async (request: Request, env: Env, ctx: ExecutionContext) =>
    (await routeAgentRequest(request, env)) ?? new Response("Not found", { status: 404 }),
};
