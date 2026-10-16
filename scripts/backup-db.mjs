// Beyond-6h backup safety net (Neon Free PITR only covers 6h).
// Dumps business tables to backups/<timestamp>/ as JSON + manifest.
// Read-only (SELECTs only). No pg_dump required — pure Node via `pg`.
//
// Usage:
//   node --env-file=.env.local scripts/backup-db.mjs
//   node --env-file=.env.local scripts/backup-db.mjs --dir backups
//
// Schedule weekly (Windows Task Scheduler, Sundays 02:00):
//   schtasks /create /tn "BuildCostGH weekly backup" /tr "node --env-file=.env.local scripts/backup-db.mjs" /sc weekly /d SUN /st 02:00
//   (run from the repo root; adjust the /tr path to your checkout)

import { Client } from "pg"
import { execFileSync } from "node:child_process"
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

// table -> columns to EXCLUDE (never back up secrets/hashes)
const TABLES = {
  '"Order"': [],
  '"Subscription"': [],
  '"SavedEstimate"': [],
  '"CalculatorLead"': [],
  '"NewsletterSubscriber"': [],
  '"ContactMessage"': [],
  '"BlogPost"': [],
  '"RegionRate"': [],
  '"Contractor"': [],
  '"User"': ["passwordHash"],
}

const outDir = join(process.argv.includes("--dir") ? process.argv[process.argv.indexOf("--dir") + 1] : "backups", new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19))

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) {
  console.error("[backup] DATABASE_URL is not set. Run with node --env-file=.env.local scripts/backup-db.mjs")
  process.exit(2)
}

const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
const manifest = { startedAt: new Date().toISOString(), tables: {}, gitSha: null }

try {
  const sha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim()
  manifest.gitSha = sha
} catch {
  // git unavailable — manifest just omits the sha
}

try {
  await client.connect()
  const { rows: v } = await client.query("SHOW server_version")
  manifest.pgVersion = v[0]?.server_version || "unknown"

  mkdirSync(outDir, { recursive: true })
  for (const [table, exclude] of Object.entries(TABLES)) {
    const bare = table.replace(/"/g, "")
    // Exclude sensitive columns in SQL so they never leave the database.
    const { rows: colRows } = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = $1",
      [bare],
    )
    const cols = colRows.map((c) => c.column_name).filter((c) => !exclude.includes(c))
    if (cols.length === 0) {
      // Table missing (DB behind on migrations) — record and continue.
      console.log(`[backup] ${bare}: MISSING (skipped)`)
      manifest.tables[bare] = "missing"
      continue
    }
    const selectList = cols.map((c) => `"${c}"`).join(", ")
    const { rows } = await client.query(`SELECT ${selectList} FROM ${table}`)
    writeFileSync(join(outDir, `${bare}.json`), JSON.stringify(rows))
    manifest.tables[bare] = rows.length
    console.log(`[backup] ${bare}: ${rows.length} rows`)
  }
  manifest.finishedAt = new Date().toISOString()
  writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2))
  console.log(`[backup] OK -> ${outDir}`)
} catch (err) {
  console.error("[backup] FAILED:", err instanceof Error ? err.message : err)
  process.exit(1)
} finally {
  await client.end().catch(() => {})
}
