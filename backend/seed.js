// seed.js
require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');           
const Stock = require('./models/Stock');
const StockHistory = require('./models/StockHistory');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/worldstocks';

async function connectDb() {
  await mongoose.connect(MONGO_URI);
  console.log('Connecté à MongoDB pour seed');
}

async function createAdmin() {
  const adminEmail = 'admin@worldstocks.local';
  const adminPassword = '123'; 

  const existing = await User.findOne({ email: adminEmail });
  if (existing) {
    console.log(`Admin déjà existant (${adminEmail})`);
    return existing;
  }

  const admin = new User({
    email: adminEmail,
    password: adminPassword,
    isAdmin: true,
    cash: 100000
  });

  await admin.save();
  console.log(`Admin créé : ${adminEmail} / mot de passe : ${adminPassword}`);
  return admin;
}

async function createStocks() {
  const stocksData = [
    {
      ticker: 'APPL',
      name: 'Apple Corporation',
      price: 172.45,
      description: 'Tech giant making devices and services',
      maxSupply: 1000000000,
      circulatingSupply: 800000000,
      change: 0,
      changePercent: 0,
      volumeToday: 0,
      turnoverToday: 0
    },
    {
      ticker: 'GOGL',
      name: 'Google Labs',
      price: 128.30,
      description: 'Search and cloud services',
      maxSupply: 900000000,
      circulatingSupply: 700000000,
      change: 0,
      changePercent: 0,
      volumeToday: 0,
      turnoverToday: 0
    },
    {
      ticker: 'AMZN',
      name: 'Amazonia',
      price: 96.75,
      description: 'E-commerce & cloud',
      maxSupply: 500000000,
      circulatingSupply: 400000000,
      change: 0,
      changePercent: 0,
      volumeToday: 0,
      turnoverToday: 0
    },
    {
      ticker: 'TSLA',
      name: 'Tesla Motors',
      price: 214.10,
      description: 'Electric vehicles',
      maxSupply: 300000000,
      circulatingSupply: 200000000,
      change: 0,
      changePercent: 0,
      volumeToday: 0,
      turnoverToday: 0
    }
  ];

  for (const s of stocksData) {
    const updated = await Stock.findOneAndUpdate(
      { ticker: s.ticker },
      { $set: s },
      { upsert: true, new: true }
    );

    const existingHistory = await StockHistory.findOne({ stock: updated._id });
    if (!existingHistory) {
      await StockHistory.create({ stock: updated._id, price: updated.price });
    }

    console.log(`Stock créé / mis à jour : ${updated.ticker} (${updated.name})`);
  }
}

async function main() {
  try {
    await connectDb();
    await createAdmin();
    await createStocks();
    console.log('Seed terminé.');
  } catch (err) {
    console.error('Erreur lors du seed :', err);
  } finally {
    mongoose.connection.close();
  }
}

main();
