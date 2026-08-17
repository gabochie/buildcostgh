const https = require('https');

// Test HTTP upgrade request like a browser would
const options = {
  hostname: 'voice.buildcostgh.com',
  port: 443,
  path: '/agents/build-cost-voice-agent/upgrade-test',
  method: 'GET',
  headers: {
    'Upgrade': 'websocket',
    'Connection': 'Upgrade',
    'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
    'Sec-WebSocket-Version': '13',
    'Origin': 'https://buildcostgh.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Sec-WebSocket-Protocol': 'cloudflare-ws-v1+cbor',
    'Sec-WebSocket-Extensions': 'permessage-deflate; client_max_window_bits',
  }
};

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    if (body) console.log('Body:', body.substring(0, 500));
  });
});

req.on('error', (e) => {
  console.log('Error:', e.message);
});

req.end();
