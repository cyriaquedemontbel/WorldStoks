require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  try {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      console.log('Transaction started OK — transactions are supported in this deployment');
      await session.abortTransaction();
      console.log('Transaction aborted OK');
    } catch (err) {
      console.error('Transaction attempt failed:', err && err.message ? err.message : err);
    } finally {
      session.endSession();
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Connection error:', err && err.message ? err.message : err);
    process.exitCode = 1;
  }
}

run();
