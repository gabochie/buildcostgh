import { runPlanBatch } from "../src/lib/content-planner"

/**
 * One-off local runner: fills the 1-year Content Plan's upcoming window by
 * calling runPlanBatch until no pending slots remain (respects
 * CONTENT_PLAN_DRAFTS_PER_RUN per iteration). Requires an LLM key
 * (OPENAI_API_KEY, GROQ_API_KEY or CEREBRAS_API_KEY) in .env.
 *
 * Usage: node --env-file=.env --import <stub-server-only.mjs> --import tsx scripts/generate-content.ts
 */
async function main() {
  const maxIterations = Number(process.env.GENERATE_MAX_ITERATIONS ?? 12)
  let total = 0
  for (let i = 1; i <= maxIterations; i++) {
    console.log(`[run ${i}] starting ...`)
    const res = await runPlanBatch()
    console.log(`[run ${i}] generated=${res.generated} pending=${res.pending}${res.error ? " ERROR=" + res.error : ""}`)
    total += res.generated
    if (res.error || res.generated === 0) break
  }
  console.log(`DONE total_generated=${total}`)
  process.exit(0)
}

main().catch((err) => {
  console.error("FATAL:", err)
  process.exit(1)
})