// backend/models/Stock.js
const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  ticker: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  previousPrice: { type: Number, default: null },   // prix du dernier jour
  lastPriceChange: { type: Number, default: 0 },    // variation en %
  description: { type: String, default: '' },
  maxSupply: { type: Number, default: 1000000 },
  circulatingSupply: { type: Number, default: 1000000 },
  volumeToday: { type: Number, default: 0 },
  turnoverToday: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Stock', stockSchema);
