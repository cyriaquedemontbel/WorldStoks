require('dotenv').config();
const mongoose = require('mongoose');

const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const Stock = require('../models/Stock');

async function main() {
  const mongo = process.env.MONGO_URI;
  if (!mongo) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(mongo, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB for backfill');

  try {
    const sellOrders = await Order.find({ type: 'sell', status: 'matched' });
    console.log(`Found ${sellOrders.length} matched sell orders to inspect`);

    let created = 0;
    for (const order of sellOrders) {
      const qtyExecuted = (order.quantity || 0) - (order.quantityRemaining || 0);
      if (!qtyExecuted || qtyExecuted <= 0) continue;

      // Check if a sell transaction for this user/stock/quantity already exists
      const exists = await Transaction.findOne({ user: order.user, stock: order.stock, type: 'sell', quantity: qtyExecuted });
      if (exists) continue;

      // Try to infer price: prefer order.price, else try to find a buy transaction for the same stock/qty
      let price = order.price ?? 0;
      const nearBuy = await Transaction.findOne({ stock: order.stock, type: 'buy', quantity: qtyExecuted }).sort({ timestamp: -1 });
      if (nearBuy && nearBuy.pricePerShare) price = nearBuy.pricePerShare;

      const stockDoc = await Stock.findById(order.stock).lean().exec();

      const tx = new Transaction({
        user: order.user,
        stock: order.stock,
        name: stockDoc?.name || order.name || null,
        ticker: stockDoc?.ticker || order.ticker || null,
        type: 'sell',
        quantity: qtyExecuted,
        pricePerShare: price,
        totalValue: (price || 0) * qtyExecuted,
        timestamp: order.timestamp || new Date(),
      });

      await tx.save();
      created += 1;
      console.log(`Created seller transaction for order ${order._id} user ${order.user} qty ${qtyExecuted} price ${price}`);
    }

    console.log(`Backfill complete. Created ${created} seller transactions.`);
  } catch (err) {
    console.error('Backfill error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

main();
