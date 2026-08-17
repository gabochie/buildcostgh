async function main() {
  const r = await fetch('https://buildcostgh.com/_next/static/chunks/app/layout-28428f7099f5826f.js');
  const t = await r.text();
  
  // Find "Connection error" context
  const idx = t.indexOf('Connection error');
  if (idx >= 0) {
    console.log('=== Connection error context ===');
    console.log(t.substring(Math.max(0, idx - 500), idx + 500));
  }
  
  // Find the VoiceWidget section
  const voiceIdx = t.indexOf('voice-agent');
  if (voiceIdx >= 0) {
    console.log('\n=== voice-agent context ===');
    console.log(t.substring(Math.max(0, voiceIdx - 300), voiceIdx + 500));
  }
  
  // Find useVoiceAgent or the hook call
  const hookIdx = t.indexOf('useVoiceAgent');
  if (hookIdx >= 0) {
    console.log('\n=== useVoiceAgent context ===');
    console.log(t.substring(Math.max(0, hookIdx - 200), hookIdx + 400));
  }
  
  // Find "enabled" 
  const enabledIdx = t.indexOf('enabled');
  if (enabledIdx >= 0) {
    console.log('\n=== enabled context ===');
    console.log(t.substring(Math.max(0, enabledIdx - 200), enabledIdx + 200));
  }
}
main();
