setInterval(function () { }, 1000);

const app = require('express')();
const https = require('https');

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
res.header('Access-Control-Allow-Headers', 'Content-Type, anthropic-version, x-api-key, Authorization');
  if (req.method === 'OPTIONS') { res.sendStatus(200); return; }
  next();
});

app.use(require('express').json({ limit: '20mb' }));

const KEY = process.env.ANTHROPIC_API_KEY;
console.log('Key loaded:', KEY ? 'YES - length ' + KEY.length : 'NO - undefined');
app.post('/api/analyze', function (req, res) {
  const body = JSON.stringify(req.body);
  const r = https.request({
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': KEY,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(body)
    }
  }, function (response) {
    let d = '';
    response.on('data', function (c) { d += c; });
    response.on('end', function () {
      console.log('Response:', d);
      try { res.json(JSON.parse(d)); }
      catch (e) { res.status(500).json({ error: 'parse error' }); }
    });
  });
  r.on('error', function (e) { res.status(500).json({ error: e.message }); });
  r.write(body);
  r.end();
});

app.listen(process.env.PORT || 3000, function () {
  console.log('PHYSIQ alive on ' + (process.env.PORT || 3000));
});