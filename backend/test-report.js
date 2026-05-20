const https = require('http');
const data = JSON.stringify({
  applicationId: '69f3d92f58178a434fd83b82',
  forceRegenerate: false
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/admin/ai-reporting/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZjNiZDY1YThiNDcwZjIwMWI2MGVkYSIsImlhdCI6MTc3ODc0NjY2NSwiZXhwIjoxNzc4NzUwMjY1fQ.05d9oy2QqKQffS5N_exozVEW6fvt6uBZsA0fEE-m9rI',
    'Content-Length': Buffer.byteLength(data)
  }
};

console.log('Sending request to backend...');
console.log('This may take 30-120s while Mistral generates the report...');

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      console.log('\n=== RESPONSE ===');
      if (parsed.report) {
        console.log('startupName:', parsed.report.startupName);
        console.log('avgScore:', parsed.report.avgScore);
        console.log('cached:', parsed.cached);
        console.log('decision:', parsed.report.report?.recommandation?.decision);
        console.log('synthese:', parsed.report.report?.synthese);
        console.log('\nFULL JSON saved — SUCCESS');
      } else {
        console.log('ERROR response:', JSON.stringify(parsed, null, 2));
      }
    } catch(e) {
      console.log('Raw response:', body.substring(0, 500));
    }
  });
});

req.on('error', (e) => console.error('Request error:', e.message));
req.setTimeout(240000, () => {
  console.error('Timeout after 240s — add OLLAMA_TIMEOUT_MS=300000 to .env');
  req.destroy();
});

req.write(data);
req.end();