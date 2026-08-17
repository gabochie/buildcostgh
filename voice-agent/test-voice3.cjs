const WebSocket = require('ws');

// Connect directly to the DO path that the client uses
const url = 'wss://buildcostgh-voice-agent.gideonabochie.workers.dev/agents/build-cost-voice-agent/test3';
console.log('Connecting to:', url);

const ws = new WebSocket(url, {
  headers: {
    'Upgrade': 'websocket',
    'Connection': 'Upgrade',
  }
});

let received = [];

ws.on('upgrade', (res) => {
  console.log('[upgrade] Status:', res.statusCode);
});

ws.on('open', () => {
  console.log('[open] Connected');
  // Send hello as the client does
  ws.send(JSON.stringify({ type: 'hello', protocol_version: 1 }));
});

ws.on('message', (data, isBinary) => {
  if (isBinary) {
    console.log('[binary]', data.length, 'bytes');
  } else {
    const str = data.toString();
    console.log('[text]', str.substring(0, 500));
    received.push(str);
  }
});

ws.on('error', (e) => {
  console.error('[error]', e.message);
});

ws.on('close', (code, reason) => {
  console.log('[close]', code, reason?.toString());
});

setTimeout(() => {
  console.log('\n--- Summary ---');
  console.log('Total messages:', received.length);
  received.forEach((r, i) => console.log(`  ${i}:`, r.substring(0, 200)));
  ws.close();
  process.exit(0);
}, 15000);
