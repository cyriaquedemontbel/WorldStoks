const express = require('express');
const Country = require('../models/Country');

const router = express.Router();

// GET /api/countries - list countries with current price and volume
router.get('/', async (req, res) => {
    try {
        const { continent, search, sort } = req.query;
        const filter = {};
        if (continent) filter.continent = continent;
        if (search) {
            filter.$or = [
                { name: new RegExp(search, 'i') },
                { code: new RegExp(search, 'i') },
            ];
        }
        const sortSpec = sort === 'price' ? { price: -1 } : sort === 'volume' ? { volume: -1 } : { name: 1 };
        const countries = await Country.find(filter).sort(sortSpec);
        const now = Date.now();
        const withVar = countries.map(c => {
            const cutoff = now - 24 * 60 * 60 * 1000;
            const past = (c.priceHistory || []).filter(p => p.t.getTime ? p.t.getTime() >= cutoff : new Date(p.t).getTime() >= cutoff);
            const first = past.length ? past[0].p : c.price; // fallback
            const variation = first ? ((c.price - first) / first) * 100 : 0;
            return { _id: c._id, name: c.name, code: c.code, price: c.price, volume: c.volume, continent: c.continent, variation24h: variation };
        });
        res.json(withVar);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch countries' });
    }
});

// GET /api/countries/top - top 10 by market cap (price * volume as simple proxy)
router.get('/top', async (req, res) => {
	try {
		const countries = await Country.find({});
		const withCap = countries
			.map(c => ({
				_id: c._id,
				name: c.name,
				code: c.code,
				price: c.price,
				volume: c.volume,
				marketCap: c.price * c.volume,
			}))
			.sort((a, b) => b.marketCap - a.marketCap)
			.slice(0, 10);
		res.json(withCap);
	} catch (error) {
		res.status(500).json({ message: 'Failed to fetch top countries' });
	}
});

// GET /api/countries/:code - get single country by code
router.get('/:code', async (req, res) => {
	try {
		const { code } = req.params;
        const country = await Country.findOne({ code: code.toUpperCase() });
        if (!country) return res.status(404).json({ message: 'Country not found' });
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        const past = (country.priceHistory || []).filter(p => new Date(p.t).getTime() >= cutoff);
        const first = past.length ? past[0].p : country.price;
        const variation = first ? ((country.price - first) / first) * 100 : 0;
        res.json({ ...country.toObject(), variation24h: variation, history24h: past });
	} catch (error) {
		res.status(500).json({ message: 'Failed to fetch country' });
	}
});

module.exports = router;


