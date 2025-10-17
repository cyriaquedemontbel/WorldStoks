// deleteAdminOpenOrders.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Order = require('./models/Order');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/worldstocks';

async function main() {
  await mongoose.connect(MONGO_URI);
  const admin = await User.findOne({ email: 'admin@worldstocks.local' });
  if (!admin) {
    console.log('Admin not found');
    process.exit(1);
  }
  const result = await Order.deleteMany({ user: admin._id, status: 'open' });
  console.log(`Deleted ${result.deletedCount} open orders for admin.`);
  await mongoose.disconnect();
}

main();
