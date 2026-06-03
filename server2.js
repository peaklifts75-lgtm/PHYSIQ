setInterval(function(){}, 1000);

const app     = require('express')();
const https   = require('https');
const cors    = require('cors');
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use(cors({ origin: '*' }));
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, anthropic-version, x-api-key, Authorization');
  if (req.method === 'OPTIONS') { res.sendStatus(200); return; }
  next();
});
app.use(require('express').json({ limit: '20mb' }));

const KEY = process.env.ANTHROPIC_API_KEY;
console.log('Key loaded:', KEY ? 'YES - length ' + KEY.length : 'NO - undefined');

const PRICES = {
  base: 'price_1Te7OJQkiY7QpEhHmzl9u18M',
  pro:  'price_1Te7OhQkiY7QpEhHgDkMp1j9'
};

// ============================================
// AI PROXY
// ============================================
app.post('/api/analyze', function(req, res) {
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
  }, function(response) {
    let d = '';
    response.on('data', function(c) { d += c; });
    response.on('end', function() {
      console.log('API Response:', d.substring(0, 200));
      try { res.json(JSON.parse(d)); }
      catch(e) { res.status(500).json({ error: 'parse error' }); }
    });
  });
  r.on('error', function(e) { res.status(500).json({ error: e.message }); });
  r.write(body);
  r.end();
});

// ============================================
// STRIPE CHECKOUT
// ============================================
app.post('/api/checkout', async function(req, res) {
  try {
    const { tier, userId, email, successUrl, cancelUrl } = req.body;
    const priceId = PRICES[tier];
    if (!priceId) return res.status(400).json({ error: 'Invalid tier' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      client_reference_id: userId,
      success_url: successUrl + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: cancelUrl,
      metadata: { userId, tier }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// STRIPE WEBHOOK — updates user tier after payment
// ============================================
app.post('/api/webhook', require('express').raw({ type: 'application/json' }), async function(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send('Webhook Error');
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId  = session.metadata.userId;
    const tier    = session.metadata.tier;
    console.log(`Payment complete — userId: ${userId}, tier: ${tier}`);
    // Supabase tier update would go here with service role key
  }

  res.json({ received: true });
});

app.get('/', function(req, res) { res.send('PHYSIQ Server running.'); });

app.listen(process.env.PORT || 3000, function() {
  console.log('PHYSIQ alive on ' + (process.env.PORT || 3000));
});