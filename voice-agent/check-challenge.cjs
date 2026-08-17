const https = require('https');

// Check if Cloudflare is challenging/blocking the voice domain
const options = {
  hostname: 'voice.buildcostgh.com',
  port: 443,
  path: '/',
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    'Origin': 'https://buildcostgh.com',
    'Accept': '*/*',
  }
};

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    if (body.length < 2000) console.log('Body:', body);
    else console.log('Body length:', body.length, 'starts with:', body.substring(0, 200));
    if (body.includes('challenge') || body.includes('captcha') || body.includes('Just a moment')) {
      console.log('\n*** CLOUDFLARE CHALLENGE DETECTED ***');
    }
  });
});

req.on('error', (e) => console.log('Error:', e.message));
req.end();
