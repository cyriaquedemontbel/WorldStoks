const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stock: { type: mongoose.Schema.Types.ObjectId, ref: 'Stock', required: true },
    type: { type: String, enum: ['buy', 'sell'], required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    quantityRemaining: { type: Number, required: true }, // pour le matching partiel
    status: { type: String, enum: ['open', 'matched', 'cancelled'], default: 'open' },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
