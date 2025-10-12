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

    stock.circulatingSupply = stock.circulatingSupply ?? 0;
    stock.volumeToday = stock.volumeToday ?? 0;
    stock.turnoverToday = stock.turnoverToday ?? 0;

    if (stock.circulatingSupply < quantity) return res.status(400).json({ message: 'Pas assez d’actions disponibles' });

    const total = stock.price * quantity;
    if (req.user.cash < total) return res.status(400).json({ message: 'Fonds insuffisants' });

    // Débiter l’utilisateur
    req.user.cash -= total;

    // Mettre à jour le portefeuille
    let portfolio = await Portfolio.findOne({ user: req.user._id, stock: stock._id });
    if (!portfolio) {
      portfolio = new Portfolio({ user: req.user._id, stock: stock._id, quantity });
    } else {
      portfolio.quantity += quantity;
    }

    // Mettre à jour le stock
    stock.circulatingSupply -= quantity;
    stock.volumeToday += quantity;
    stock.turnoverToday += total;

    const priceIncreaseFactor = 0.01 * (quantity / (stock.circulatingSupply + quantity));
    stock.price = Math.max(stock.price * (1 + priceIncreaseFactor), 0.01);

    await Promise.all([req.user.save(), portfolio.save(), stock.save()]);

    const transaction = new Transaction({
      user: req.user._id,
      stock: stock._id,
      name: stock.name,
      ticker: stock.ticker,
      type: 'buy',
      quantity,
      pricePerShare: stock.price,
      totalValue: total,
      timestamp: new Date(),
    });
    await transaction.save();

    // Construire portfolio pour le frontend
    const userPortfolio = await Portfolio.find({ user: req.user._id }).populate('stock');
    const portfolioObject = {};
    userPortfolio.forEach(p => {
      portfolioObject[p.stock.ticker] = p.quantity;
    });

    res.json({ success: true, user: req.user, portfolio: portfolioObject, stock, transaction });
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

    if (!quantity || quantity <= 0) 
      return res.status(400).json({ message: 'Quantité invalide' });
    if (!req.user) 
      return res.status(401).json({ message: 'Utilisateur non authentifié' });

    const stock = await Stock.findOne({ ticker });
    if (!stock) 
      return res.status(404).json({ message: 'Stock non trouvé' });

    const portfolio = await Portfolio.findOne({ user: req.user._id, stock: stock._id });
    if (!portfolio || portfolio.quantity < quantity) 
      return res.status(400).json({ message: 'Quantité insuffisante' });

    const total = stock.price * quantity;

    // Mettre à jour le portefeuille
    portfolio.quantity -= quantity;

    if (portfolio.quantity <= 0) {
      // 🔹 Utilisation de deleteOne() au lieu de remove() pour plus de sécurité
      await portfolio.deleteOne();
    } else {
      await portfolio.save();
    }

    // Ajouter les fonds à l'utilisateur
    req.user.cash += total;
    await req.user.save();

    // Mettre à jour le stock
    stock.circulatingSupply += quantity;
    stock.volumeToday += quantity;
    stock.turnoverToday += total;

    // 🔹 Calcul du prix sécurisé pour éviter division par zéro
    let priceDecreaseFactor = 0;
    if (stock.circulatingSupply > 0) {
      priceDecreaseFactor = 0.01 * (quantity / stock.circulatingSupply);
    }

    stock.price = Math.max(stock.price * (1 - priceDecreaseFactor), 0.01);

    await stock.save();

    const transaction = new Transaction({
      user: req.user._id,
      stock: stock._id,
      name: stock.name,
      ticker: stock.ticker,
      type: 'sell',
      quantity,
      pricePerShare: stock.price,
      totalValue: total,
      timestamp: new Date(),
    });
    await transaction.save();

    // Construire portfolio pour le frontend
    const userPortfolio = await Portfolio.find({ user: req.user._id }).populate('stock');
    const portfolioObject = {};
    userPortfolio.forEach(p => {
      portfolioObject[p.stock.ticker] = p.quantity;
    });

    res.json({ success: true, user: req.user, portfolio: portfolioObject, stock, transaction });

  } catch (err) {
    console.error('Erreur vente action:', err);
    res.status(500).json({ message: 'Impossible de vendre l’action' });
  }
});


module.exports = router;
