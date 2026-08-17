const WebSocket = require('ws');

const ws = new WebSocket('wss://buildcostgh-voice-agent.gideonabochie.workers.dev/agents/build-cost-voice-agent/test-probe2');

let audioBytes = 0;
let jsonMessages = [];

ws.on('open', () => {
  console.log('[open] Connected');
  ws.send(JSON.stringify({ type: 'hello', protocol_version: 1 }));
});

ws.on('message', (data) => {
  if (typeof data === 'string') {
    const msg = JSON.parse(data);
    jsonMessages.push(msg);
    console.log('[JSON]', msg.type, JSON.stringify(msg).substring(0, 500));
    
    if (msg.type === 'welcome') {
      console.log('[action] Got welcome, sending start_call');
      ws.send(JSON.stringify({ type: 'start_call' }));
    }
    if (msg.type === 'audio_config') {
      console.log('[action] Call started! format:', msg.format);
    }
    if (msg.type === 'status') {
      console.log('[action] Status:', msg.status);
    }
    if (msg.type === 'error') {
      console.error('[ERROR FROM SERVER]', msg.message);
    }
  } else {
    audioBytes += data.length;
  }
});

ws.on('error', (e) => {
  console.error('[ws-error]', e.message);
});

ws.on('close', (code, reason) => {
  console.log('[close]', code, reason.toString());
});

setTimeout(() => {
  console.log('\n[summary]');
  console.log('JSON messages received:', jsonMessages.length);
  console.log('Message types:', jsonMessages.map(m => m.type).join(', '));
  console.log('Total audio bytes:', audioBytes);
  ws.close();
  process.exit(0);
}, 20000);
