const http = require('http');

const payload = JSON.stringify({ email: 'test@example.com', password: 'password123' });

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': payload.length,
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('✅ Status:', res.statusCode);
    console.log('📦 Response:', JSON.stringify(JSON.parse(data), null, 2));
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

req.write(payload);
req.end();

// Timeout nach 5 Sekunden
setTimeout(() => {
  console.error('❌ Timeout after 5 seconds');
  process.exit(1);
}, 5000);
