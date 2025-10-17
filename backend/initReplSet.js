const { MongoClient } = require('mongodb');

async function run() {
  const uri = 'mongodb://127.0.0.1:27018';
  // Increase serverSelectionTimeoutMS to allow mongod to finish startup
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 60000 });
  try {
    await client.connect();
    console.log('Connected to', uri);
    const adminDb = client.db('admin');
    const config = {
      _id: 'rs0',
      members: [
        { _id: 0, host: '127.0.0.1:27018' }
      ]
    };
    try {
      const res = await adminDb.command({ replSetInitiate: config });
      console.log('replSetInitiate result:', res);
    } catch (err) {
      console.error('replSetInitiate error:', err && err.message ? err.message : err);
    }
    // Wait a bit then get status
    await new Promise(r => setTimeout(r, 2000));
    try {
      const status = await adminDb.command({ replSetGetStatus: 1 });
      console.log('replSet status:', JSON.stringify(status, null, 2));
    } catch (err) {
      console.error('replSetGetStatus error:', err && err.message ? err.message : err);
    }
  } catch (err) {
    console.error('Connection/init error:', err && err.message ? err.message : err);
  } finally {
    await client.close();
  }
}

run();
