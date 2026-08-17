const WebSocket = require('ws');

const url = 'wss://buildcostgh-voice-agent.gideonabochie.workers.dev/agents/build-cost-voice-agent/test5';
const ws = new WebSocket(url);

ws.on('open', () => {
  ws.send(JSON.stringify({ type: 'hello', protocol_version: 1 }));
});

ws.on('message', (data, isBinary) => {
  if (isBinary) return;
  const msg = JSON.parse(data.toString());
  if (msg.type === 'error') {
    console.log('ERROR:', msg.message);
  } else if (msg.type === 'audio_config') {
    console.log('audio_config:', JSON.stringify(msg));
    setTimeout(() => {
      ws.send(JSON.stringify({ type: 'start_call' }));
    }, 300);
  } else if (msg.type === 'welcome') {
    setTimeout(() => {
      ws.send(JSON.stringify({ type: 'start_call' }));
    }, 300);
  } else {
    console.log(msg.type, msg.status || '');
  }
});

ws.on('error', (e) => console.error('ws-error:', e.message));

setTimeout(() => { ws.close(); process.exit(0); }, 10000);
