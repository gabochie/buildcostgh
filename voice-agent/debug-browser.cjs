async function main() {
  const html = await (await fetch('https://buildcostgh.com')).text();
  const chunkMatches = [...html.matchAll(/\/_next\/static\/chunks\/([^"']+\.js)/g)];
  const chunks = [...new Set(chunkMatches.map(m => m[1]))];
  
  // Get all chunks and check for PartySocket
  for (const c of chunks) {
    try {
      const r = await fetch('https://buildcostgh.com/_next/static/chunks/' + c);
      const t = await r.text();
      const refs = [];
      if (t.includes('PartySocket')) refs.push('PartySocket');
      if (t.includes('partysocket')) refs.push('partysocket');
      if (t.includes('VoiceClient')) refs.push('VoiceClient');
      if (t.includes('WebSocketVoiceTransport')) refs.push('WebSocketVoiceTransport');
      if (t.includes('useVoiceAgent')) refs.push('useVoiceAgent');
      if (t.includes('Connection')) refs.push('Connection');
      if (refs.length > 0) {
        console.log(c + ' (' + t.length + '): ' + refs.join(', '));
      }
    } catch(e) {}
  }
}
main();
