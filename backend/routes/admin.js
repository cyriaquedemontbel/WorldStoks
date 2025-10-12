const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Stock = require('../models/Stock');
const StockHistory = require('../models/StockHistory');

// ==============================
// Créer un stock
// ==============================
router.post('/stocks', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Accès refusé' });

  try {
    const { name, ticker, price, circulating_supply } = req.body;
    const existing = await Stock.findOne({ ticker });
    if (existing) return res.status(400).json({ message: 'Ticker déjà existant' });

    const stock = new Stock({ name, ticker, price, circulating_supply });
    await stock.save();

    res.status(201).json(stock);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la création du stock' });
  }
});

// ==============================
// Mettre à jour un stock
// ==============================
router.put('/stocks/:ticker', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Accès refusé' });

  try {
    const stock = await Stock.findOne({ ticker: req.params.ticker });
    if (!stock) return res.status(404).json({ message: 'Stock non trouvé' });

    const updates = req.body;
    Object.assign(stock, updates);
    await stock.save();

    res.json(stock);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du stock' });
  }
});

// ==============================
// Supprimer un stock
// ==============================
router.delete('/stocks/:ticker', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Accès refusé' });

  try {
    const stock = await Stock.findOne({ ticker: req.params.ticker });
    if (!stock) return res.status(404).json({ message: 'Stock non trouvé' });

    await stock.deleteOne();
    res.json({ message: 'Stock supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la suppression du stock' });
  }
});

// ==============================
// Mise à jour AI du marché
// ==============================
router.post('/update-ai', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Accès refusé' });

  try {
    const stocks = await Stock.find();

    for (let stock of stocks) {
      const changePercent = (Math.random() - 0.5) * 0.1;
      const oldPrice = stock.price;
      stock.price = Math.max(0.01, oldPrice * (1 + changePercent));

      stock.change_24h = stock.price - oldPrice;
      stock.change_percent_24h = ((stock.change_24h) / oldPrice) * 100;

      stock.volume_today = Math.floor(Math.random() * 1000);
      stock.turnover_today = stock.volume_today * stock.price;

      stock.circulating_supply = Math.max(0, stock.circulating_supply + Math.floor((Math.random() - 0.5) * 1000));

      await stock.save();
      await StockHistory.create({ stock: stock._id, price: stock.price });
    }

    res.json(stocks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du marché' });
  }
});

module.exports = router;
