const WebSocket = require('ws');

const url = 'wss://buildcostgh-voice-agent.gideonabochie.workers.dev/agents/build-cost-voice-agent/test4';
console.log('Connecting to:', url);

const ws = new WebSocket(url);

let received = [];
let audioBytes = 0;

ws.on('open', () => {
  console.log('[open] Connected');
  ws.send(JSON.stringify({ type: 'hello', protocol_version: 1 }));
});

ws.on('message', (data, isBinary) => {
  if (isBinary) {
    audioBytes += data.length;
    console.log('[binary]', data.length, 'bytes (total:', audioBytes + ')');
  } else {
    const str = data.toString();
    const msg = JSON.parse(str);
    console.log('[json]', msg.type, msg.status || msg.text || '');
    received.push(msg);
    
    if (msg.type === 'status' && msg.status === 'idle') {
      // Send start_call after getting idle status
      setTimeout(() => {
        console.log('[action] Sending start_call...');
        ws.send(JSON.stringify({ type: 'start_call' }));
      }, 500);
    }
    
    if (msg.type === 'status' && msg.status === 'listening') {
      console.log('[action] Agent is listening! Sending text message...');
      setTimeout(() => {
        ws.send(JSON.stringify({ type: 'text_message', text: 'What is the cost of building a 3 bedroom house in Ghana?' }));
      }, 1000);
    }
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
  console.log('JSON messages:', received.map(m => m.type + (m.status ? ':' + m.status : '')).join(', '));
  console.log('Total audio bytes:', audioBytes);
  ws.close();
  process.exit(0);
}, 25000);
