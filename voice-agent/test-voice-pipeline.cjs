const WebSocket = require('ws');

const ws = new WebSocket('wss://buildcostgh-voice-agent.gideonabochie.workers.dev/agents/build-cost-voice-agent/test-probe');

ws.on('open', () => {
  console.log('[open] Connected');
  ws.send(JSON.stringify({ type: 'hello', protocol_version: 1 }));
});

ws.on('message', (data) => {
  if (typeof data === 'string') {
    const msg = JSON.parse(data);
    console.log('[message]', msg.type, JSON.stringify(msg).substring(0, 300));
    if (msg.type === 'welcome') {
      console.log('[action] Sending start_call');
      ws.send(JSON.stringify({ type: 'start_call' }));
    }
    if (msg.type === 'audio_config') {
      console.log('[action] Call started! Waiting for greeting...');
      setTimeout(() => {
        console.log('[action] Sending text_message to test LLM');
        ws.send(JSON.stringify({ type: 'text_message', text: 'Hello, what is the cost of building a 3 bedroom house in Ghana?' }));
      }, 3000);
    }
    if (msg.type === 'error') {
      console.error('[ERROR FROM SERVER]', msg.message);
    }
  } else {
    console.log('[binary] Audio data received:', data.length, 'bytes');
  }
});

ws.on('error', (e) => {
  console.error('[error]', e.message);
});

ws.on('close', (code, reason) => {
  console.log('[close]', code, reason.toString());
});

setTimeout(() => {
  console.log('[timeout] Closing after 30s');
  ws.close();
  process.exit(0);
}, 30000);
