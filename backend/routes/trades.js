const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Stock = require('../models/Stock');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');

// ==============================
// ACHAT D’ACTIONS
// ==============================
router.post('/buy', auth, async (req, res) => {
  try {
    const { ticker, quantity: rawQuantity } = req.body;
    const quantity = Number(rawQuantity);
    if (!quantity || quantity <= 0) return res.status(400).json({ message: 'Quantité invalide' });
    if (!req.user) return res.status(401).json({ message: 'Utilisateur non authentifié' });

    const stock = await Stock.findOne({ ticker });
    if (!stock) return res.status(404).json({ message: 'Stock non trouvé' });

    // Valeurs par défaut
    stock.circulatingSupply = stock.circulatingSupply ?? 0;
    stock.volumeToday = stock.volumeToday ?? 0;
    stock.turnoverToday = stock.turnoverToday ?? 0;

    if (stock.circulatingSupply < quantity)
      return res.status(400).json({ message: 'Pas assez d’actions disponibles' });

    const currentPrice = stock.price;
    const total = currentPrice * quantity;

    if (req.user.cash < total) return res.status(400).json({ message: 'Fonds insuffisants' });

    req.user.cash -= total;

    let portfolio = await Portfolio.findOne({ user: req.user._id, stock: stock._id });
    if (!portfolio) portfolio = new Portfolio({ user: req.user._id, stock: stock._id, quantity });
    else portfolio.quantity += quantity;

    const transaction = new Transaction({
      user: req.user._id,
      stock: stock._id,
      name: stock.name,
      ticker: stock.ticker,
      type: 'buy',
      quantity,
      pricePerShare: currentPrice,
      totalValue: total,
      timestamp: new Date(),
    });
    await transaction.save();

    stock.circulatingSupply -= quantity;
    stock.volumeToday += quantity;
    stock.turnoverToday += total;

  // 🔹 Définir priceAtOpen si pas défini
  if (!stock.priceAtOpen) stock.priceAtOpen = stock.price;

  // 🔹 Met à jour le prix de l'action avec le prix de la transaction
  stock.price = currentPrice;

  // 🔹 Calcul du changement par rapport à priceAtOpen
  stock.change = stock.price - stock.priceAtOpen;
  stock.changePercent = ((stock.price - stock.priceAtOpen) / stock.priceAtOpen) * 100;

  await Promise.all([req.user.save(), portfolio.save(), stock.save()]);

    const userPortfolio = await Portfolio.find({ user: req.user._id }).populate('stock');
    const portfolioObject = {};
      userPortfolio.forEach(p => {
        if (p && p.stock && p.stock.ticker) {
          portfolioObject[p.stock.ticker] = p.quantity;
        }
      });

    res.json({
      success: true,
      user: req.user,
      portfolio: portfolioObject,
      stock,
      transaction,
      priceChangePercent: stock.changePercent.toFixed(2) + '%',
    });

  } catch (err) {
    console.error('Erreur achat action:', err);
    res.status(500).json({ message: 'Impossible d’acheter l’action' });
  }
});

// ==============================
// VENTE D’ACTIONS
// ==============================
router.post('/sell', auth, async (req, res) => {
  try {
    const { ticker, quantity: rawQuantity } = req.body;
    const quantity = Number(rawQuantity);
    if (!quantity || quantity <= 0) return res.status(400).json({ message: 'Quantité invalide' });
    if (!req.user) return res.status(401).json({ message: 'Utilisateur non authentifié' });

    const stock = await Stock.findOne({ ticker });
    if (!stock) return res.status(404).json({ message: 'Stock non trouvé' });

    const portfolio = await Portfolio.findOne({ user: req.user._id, stock: stock._id });
    if (!portfolio || portfolio.quantity < quantity)
      return res.status(400).json({ message: 'Quantité insuffisante' });

    const currentPrice = stock.price;
    const total = currentPrice * quantity;

    portfolio.quantity -= quantity;
    if (portfolio.quantity <= 0) await portfolio.deleteOne();
    else await portfolio.save();

    req.user.cash += total;
    await req.user.save();

    const transaction = new Transaction({
      user: req.user._id,
      stock: stock._id,
      name: stock.name,
      ticker: stock.ticker,
      type: 'sell',
      quantity,
      pricePerShare: currentPrice,
      totalValue: total,
      timestamp: new Date(),
    });
    await transaction.save();

    stock.circulatingSupply += quantity;
    stock.volumeToday += quantity;
    stock.turnoverToday += total;

  if (!stock.priceAtOpen) stock.priceAtOpen = stock.price;

  // 🔹 Met à jour le prix de l'action avec le prix de la transaction
  stock.price = currentPrice;

  // 🔹 Calcul du changement par rapport à priceAtOpen
  stock.change = stock.price - stock.priceAtOpen;
  stock.changePercent = ((stock.price - stock.priceAtOpen) / stock.priceAtOpen) * 100;

  await stock.save();

    const userPortfolio = await Portfolio.find({ user: req.user._id }).populate('stock');
    const portfolioObject = {};
      userPortfolio.forEach(p => {
        if (p && p.stock && p.stock.ticker) {
          portfolioObject[p.stock.ticker] = p.quantity;
        }
      });

    res.json({
      success: true,
      user: req.user,
      portfolio: portfolioObject,
      stock,
      transaction,
      priceChangePercent: stock.changePercent.toFixed(2) + '%',
    });

  } catch (err) {
    console.error('Erreur vente action:', err);
    res.status(500).json({ message: 'Impossible de vendre l’action' });
  }
});

module.exports = router;
