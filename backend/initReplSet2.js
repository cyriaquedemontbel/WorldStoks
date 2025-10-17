bmo!ltyurfk!fioconst { MongoClient } = require('mongodb');

async function waitConnect(uri, opts, retries = 12, delayMs = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = new MongoClient(uri, opts);
      await client.connect();
      return client;
    } catch (err) {
      console.log(`Connect attempt ${i+1} failed: ${err.message}`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error('Could not connect after retries');
}

(async () => {
  const uri = 'mongodb://127.0.0.1:27018/?directConnection=true';
  const opts = { serverSelectionTimeoutMS: 60000 };
  try {
    const client = await waitConnect(uri, opts, 20, 2000);
    console.log('Connected to', uri);
    const adminDb = client.db('admin');
    const config = { _id: 'rs0', members: [{ _id: 0, host: '127.0.0.1:27018' }] };
    try {
      const res = await adminDb.command({ replSetInitiate: config });
      console.log('replSetInitiate result:', res);
    } catch (err) {
      console.error('replSetInitiate error:', err.message || err);
    }
    await new Promise(r => setTimeout(r, 2000));
    try {
      const status = await adminDb.command({ replSetGetStatus: 1 });
      console.log('replSet status:', JSON.stringify(status, null, 2));
    } catch (err) {
      console.error('replSetGetStatus error:', err.message || err);
    }
    await client.close();
  } catch (err) {
    console.error('Fatal error:', err.message || err);
    process.exit(1);
  }
})();
