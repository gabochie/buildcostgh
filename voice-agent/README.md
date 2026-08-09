# BuildCost GH — Voice Agent

Cloudflare Workers voice agent for the BuildCost GH assistant. Users call it from the
chat widget (mic button) and talk to the same construction-cost knowledge base the
text assistant uses.

Stack: `@cloudflare/voice` (WorkersAIFluxSTT + WorkersAITTS) with an OpenAI LLM
(`gpt-4o-mini` by default). State persists per visitor via SQLite-backed Durable
Object (`BuildCostVoiceAgent`).

## Local development

```bash
# 1. set up secrets
cp .dev.vars.example .dev.vars   # fill in OPENAI_API_KEY

# 2. run the worker (AI binding + DO + SQLite migration are auto-applied)
npm run dev
```

The client connects to `wss://{host}/agents/BuildCostVoiceAgent/{session}` where
`host` defaults to `window.location.host`. In dev, point the app at the worker by
setting `NEXT_PUBLIC_VOICE_AGENT_HOST=localhost:8787` in the app's `.env.local`.

## Deploying to Cloudflare

```bash
# 1. set the secret (workers.dev / custom domain)
npx wrangler secret put OPENAI_API_KEY

# 2. deploy
npm run deploy
```

This creates/updates the `buildcostgh-voice-agent` Worker with:

- `ai` binding (`AI`) → STT + TTS
- Durable Object `BuildCostVoiceAgent` + SQLite migration `v1`
- `OPENAI_MODEL` var (default `gpt-4o-mini`, change per cost/quality needs)

### Custom domain (recommended for production)

`wrangler.jsonc` has no `routes` entry, so the worker deploys to
`buildcostgh-voice-agent.<your-subdomain>.workers.dev` by default.

For a clean host (needed by the widget to connect), add a custom domain in the
Cloudflare dashboard (Workers → buildcostgh-voice-agent → Settings → Domains &
Routes → Add Custom Domain, e.g. `voice.buildcostgh.com`).

## Wiring the app to the worker

The app's voice widget reads the worker host from an env var:

```bash
NEXT_PUBLIC_VOICE_AGENT_HOST=voice.buildcostgh.com   # in Vercel + .env.local
```

When unset, the widget falls back to `window.location.host`, which only works when
the app and worker share a host (custom domain attached to the same zone). Set it
explicitly to be safe.

> **HTTPS required** — the WebSocket voice transport uses `wss://`. Custom domains
> on Cloudflare are HTTPS by default; workers.dev is also HTTPS. Do not use the raw
> `localhost:8787` value outside local dev.

## Model / prompt

- Prompt + Ghana construction knowledge: `src/knowledge.ts`
- Model: `OPENAI_MODEL` var (see `wrangler.jsonc`)
