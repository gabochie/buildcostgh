const base = "https://buildcostgh-voice-agent.gideonabochie.workers.dev"
const paths = ["/", "/agents/build-cost-voice-agent/test", "/api/voice", "/api/health"]
Promise.all(paths.map(async p => {
  try {
    const r = await fetch(base + p)
    const t = await r.text()
    return { path: p, status: r.status, body: t.substring(0, 200) }
  } catch (e) {
    return { path: p, status: "ERR", body: e.message }
  }
})).then(results => results.forEach(r => {
  console.log(`${r.path} => ${r.status}`)
  if (r.body) console.log(`  Body: ${r.body}`)
}))
