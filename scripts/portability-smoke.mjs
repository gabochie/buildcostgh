// Quarterly DB-portability proof: boots the app against VANILLA Postgres
// (not Neon) and asserts the health check + homepage pass.
// Usage: node scripts/portability-smoke.mjs [--keep]

import { execFileSync, spawnSync } from "node:child_process"

const COMPOSE = ["compose", "-f", "docker-compose.portability.yml"]
const KEEP = process.argv.includes("--keep")

function compose(...args) {
  return spawnSync("docker", [...COMPOSE, ...args], { stdio: "inherit", shell: false })
}

function fail(msg) {
  console.error(`[smoke] FAIL: ${msg}`)
  if (!KEEP) compose("down", "-v")
  process.exit(1)
}

async function waitFor(url, timeoutMs, label) {
  const start = Date.now()
  for (;;) {
    try {
      const res = await fetch(url)
      const body = await res.text()
      if (res.ok && body.includes(label)) {
        console.log(`[smoke] ${url} OK (${Date.now() - start}ms)`)
        return body
      }
      console.log(`[smoke] ${url} -> ${res.status}, retrying...`)
    } catch {
      console.log(`[smoke] ${url} unreachable, retrying...`)
    }
    if (Date.now() - start > timeoutMs) fail(`${url} never became healthy`)
    await new Promise((r) => setTimeout(r, 5000))
  }
}

console.log("[smoke] bringing up app + vanilla Postgres...")
const up = compose("up", "--build", "-d")
if (up.status !== 0) fail("docker compose up failed")

try {
  const health = await waitFor("http://localhost:3000/api/health", 240_000, "healthy")
  if (!health.includes('"connected":true')) fail("DB not connected (Neon-only queries?)")
  await waitFor("http://localhost:3000/", 60_000, "BuildCost")
  console.log("[smoke] PASS: app runs on vanilla Postgres — no Neon lock-in")
} finally {
  if (!KEEP) compose("down", "-v")
}
