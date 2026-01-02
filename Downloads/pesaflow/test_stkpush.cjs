const http = require('http');

const data = JSON.stringify({
  phoneNumber: '254700000000',
  amount: 10,
  accountReference: 'PesaFlow',
  userId: 'test-user'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/stkPush',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('HTTP_STATUS', res.statusCode);
    try { console.log('BODY', JSON.parse(body)); }
    catch (e) { console.log('BODY', body); }
  });
});

req.on('error', (e) => {
  console.error('REQUEST_ERROR', e.message);
});

req.write(data);
req.end();
