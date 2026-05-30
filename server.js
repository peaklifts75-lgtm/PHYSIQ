const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = 3000;

const ANTHROPIC_API_KEY = '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';

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '20mb' }));

app.get('/', (req, res) => {
  res.send('PHYSIQ Server is running.');
});

app.post('/api/analyze', (req, res) => {
  const body = JSON.stringify(req.body);
  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(body)
    }
  };
  const request = https.request(options, (response) => {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', () => {
      console.log('API Response:', data);
      try {
        res.json(JSON.parse(data));
      } catch (e) {
        res.status(500).json({ error: 'Invalid response' });
      }
    });
  });
  request.on('error', (err) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Request failed' });
  });
  request.write(body);
  request.end();
});

const server = app.listen(PORT, () => {
  console.log('PHYSIQ server running on http://localhost:' + PORT);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

setInterval(() => {}, 1000);