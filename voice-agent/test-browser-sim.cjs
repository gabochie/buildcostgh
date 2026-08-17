const WebSocket = require('ws');

// Exact URL PartySocket would construct:
// wss://{host}/agents/{party}/{room}
// host = "voice.buildcostgh.com"
// party = camelCaseToKebabCase("build-cost-voice-agent") = "build-cost-voice-agent"
// room = sessionName (e.g. "visitor_abc123")
// prefix = "agents"

const url = 'wss://voice.buildcostgh.com/agents/build-cost-voice-agent/visitor_test123';
console.log('Connecting to:', url);

const ws = new WebSocket(url);

ws.on('open', () => {
  console.log('[open] WebSocket connected');
  // VoiceClient sends hello immediately on open
  ws.send(JSON.stringify({ type: 'hello', protocol_version: 1 }));
});

ws.on('message', (data, isBinary) => {
  if (isBinary) return;
  const msg = JSON.parse(data.toString());
  console.log('[' + msg.type + ']', JSON.stringify(msg).substring(0, 200));
  
  // After getting audio_config, try start_call
  if (msg.type === 'audio_config') {
    console.log('[action] Sending start_call...');
    ws.send(JSON.stringify({ type: 'start_call' }));
  }
  
  // After listening, send a text message like the browser would
  if (msg.type === 'status' && msg.status === 'listening') {
    setTimeout(() => {
      console.log('[action] Sending text_message...');
      ws.send(JSON.stringify({ type: 'text_message', text: 'Hello, what services do you offer?' }));
    }, 1000);
  }
  
  if (msg.type === 'transcript_end') {
    console.log('[response]', msg.text?.substring(0, 300));
    setTimeout(() => { ws.close(); process.exit(0); }, 2000);
  }
  
  if (msg.type === 'error') {
    console.log('[ERROR FROM SERVER]:', msg.message);
  }
});

ws.on('error', (e) => {
  console.log('[ws-error]', e.message);
});

ws.on('close', (code, reason) => {
  console.log('[close]', code, reason?.toString());
});

setTimeout(() => { console.log('TIMEOUT'); ws.close(); process.exit(0); }, 30000);
