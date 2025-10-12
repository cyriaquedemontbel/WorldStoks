// backend/models/Stock.js
const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  ticker: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, default: '' },
  maxSupply: { type: Number, default: 1000000 },       // Offre maximale
  circulatingSupply: { type: Number, default: 1000000 }, // Offre initiale = maxSupply
  change: { type: Number, default: 0 },
  changePercent: { type: Number, default: 0 },
  volumeToday: { type: Number, default: 0 },
  turnoverToday: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Stock', stockSchema);
