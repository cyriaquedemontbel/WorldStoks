const express = require('express');
// const mongoose = require('mongoose');
const Country = require('../models/Country');
const User = require('../models/User');

const router = express.Router();

// Helper: apply price change based on quantity
function applyPriceChange(currentPrice, quantityDelta) {
    // 1 action = +/- 0.1 EUR on price
    return Number((currentPrice + 0.1 * quantityDelta).toFixed(3));
}

// POST /api/trades/buy { userId, countryCode, quantity }
router.post('/buy', async (req, res) => {
	try {
		const { userId, countryCode } = req.body;
		const quantity = Number(req.body.quantity);
		if (!userId || !countryCode || !quantity || quantity < 1) {
			return res.status(400).json({ message: 'Invalid payload' });
		}

		const [user, country] = await Promise.all([
			User.findById(userId),
			Country.findOne({ code: countryCode.toUpperCase() }),
		]);
		if (!user || !country) return res.status(404).json({ message: 'User or country not found' });

		const costEur = Number((quantity * country.price).toFixed(2));
		if (user.cashBalanceEur < costEur) return res.status(400).json({ message: 'Insufficient balance', need: costEur, have: user.cashBalanceEur });

		user.cashBalanceEur = Number((user.cashBalanceEur - costEur).toFixed(2));
		const holding = user.holdings.find(h => h.country.toString() === country._id.toString());
		if (holding) holding.quantity += quantity;
		else user.holdings.push({ country: country._id, quantity });
		user.transactions.push({ type: 'BUY', country: country._id, quantity, priceAtExecution: country.price });
		await user.save();

		country.price = applyPriceChange(country.price, quantity);
		country.volume += quantity;
		country.priceHistory.push({ t: new Date(), p: country.price });
		await country.save();

		return res.json({ success: true, country, user });
	} catch (error) {
		console.error('Trade buy error:', error);
		return res.status(500).json({ message: 'Trade failed', error: error.message });
	}
});

// POST /api/trades/sell { userId, countryCode, quantity }
router.post('/sell', async (req, res) => {
	try {
		const { userId, countryCode } = req.body;
		const quantity = Number(req.body.quantity);
		if (!userId || !countryCode || !quantity || quantity < 1) {
			return res.status(400).json({ message: 'Invalid payload' });
		}

		const [user, country] = await Promise.all([
			User.findById(userId),
			Country.findOne({ code: countryCode.toUpperCase() }),
		]);
		if (!user || !country) return res.status(404).json({ message: 'User or country not found' });

		const holding = user.holdings.find(h => h.country.toString() === country._id.toString());
		if (!holding || holding.quantity < quantity) return res.status(400).json({ message: 'Insufficient holdings' });

		const proceedsEur = Number((quantity * country.price).toFixed(2));
		user.cashBalanceEur = Number((user.cashBalanceEur + proceedsEur).toFixed(2));
		holding.quantity -= quantity;
		if (holding.quantity === 0) {
			user.holdings = user.holdings.filter(h => h.country.toString() !== country._id.toString());
		}
		user.transactions.push({ type: 'SELL', country: country._id, quantity, priceAtExecution: country.price });
		await user.save();

		country.price = applyPriceChange(country.price, -quantity);
		country.volume += quantity;
		country.priceHistory.push({ t: new Date(), p: country.price });
		await country.save();

		return res.json({ success: true, country, user });
	} catch (error) {
		console.error('Trade sell error:', error);
		return res.status(500).json({ message: 'Trade failed', error: error.message });
	}
});

module.exports = router;


