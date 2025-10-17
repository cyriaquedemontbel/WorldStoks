const fetch = require('node-fetch');

const BASE = 'http://localhost:5000';

async function run() {
  try {
    // Login as admin
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@worldstocks.local', password: '123' })
    });
    const loginJson = await loginRes.json();
    console.log('Login response:', loginJson);
    if (!loginJson.token) {
      console.error('Login failed, cannot continue');
      return;
    }
    const token = loginJson.token;

    // Place an order
    const orderPayload = { ticker: 'APPL', type: 'buy', price: 1, quantity: 1 };
    console.log('Placing order:', orderPayload);
    const placeRes = await fetch(`${BASE}/api/orders/place`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(orderPayload)
    });
    const placeJson = await placeRes.json();
    console.log('Place order status:', placeRes.status);
    console.log('Place order response:', placeJson);
  } catch (err) {
    console.error('Error running repro:', err);
  }
}

run();
