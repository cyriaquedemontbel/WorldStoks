const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const Stock = require('../models/Stock');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');

// Placer un ordre d'achat ou de vente
router.post('/place', auth, async (req, res) => {
  try {
    const { ticker, type, price, quantity } = req.body;
    if (!ticker || !type || !price || !quantity) {
      return res.status(400).json({ message: 'Paramètres manquants' });
    }
    if (!['buy', 'sell'].includes(type)) {
      return res.status(400).json({ message: 'Type d\'ordre invalide' });
    }
    const stock = await Stock.findOne({ ticker });
    if (!stock) return res.status(404).json({ message: 'Stock non trouvé' });

    // Vérification des fonds ou des actions disponibles
    if (type === 'buy' && req.user.cash < price * quantity) {
      return res.status(400).json({ message: 'Fonds insuffisants' });
    }
    if (type === 'sell') {
      const portfolio = await Portfolio.findOne({ user: req.user._id, stock: stock._id });
      if (!portfolio || portfolio.quantity < quantity) {
        return res.status(400).json({ message: 'Pas assez d\'actions à vendre' });
      }
    }

    // Création de l'ordre
    let order = new Order({
      user: req.user._id,
      stock: stock._id,
      type,
      price,
      quantity,
      quantityRemaining: quantity,
      status: 'open',
    });
    await order.save();

    // Matching automatique
    let matchedOrders = [];
    let qtyToMatch = order.quantityRemaining;
    if (type === 'buy') {
      // Cherche les ordres de vente ouverts au prix <= order.price
      matchedOrders = await Order.find({
        stock: stock._id,
        type: 'sell',
        price: { $lte: price },
        status: 'open',
      }).sort({ price: 1, timestamp: 1 });
    } else {
      // Cherche les ordres d'achat ouverts au prix >= order.price
      matchedOrders = await Order.find({
        stock: stock._id,
        type: 'buy',
        price: { $gte: price },
        status: 'open',
      }).sort({ price: -1, timestamp: 1 });
    }

    for (const match of matchedOrders) {
      if (qtyToMatch <= 0) break;
      const matchQty = Math.min(qtyToMatch, match.quantityRemaining);
      const transactionPrice = match.price;

      // Mise à jour des portefeuilles et cash
      let buyer, seller;
      if (type === 'buy') {
        buyer = req.user;
        seller = match.user;
      } else {
        buyer = match.user;
        seller = req.user;
      }

      // Mise à jour du portefeuille acheteur
      let buyerPortfolio = await Portfolio.findOne({ user: buyer._id, stock: stock._id });
      if (!buyerPortfolio) buyerPortfolio = new Portfolio({ user: buyer._id, stock: stock._id, quantity: matchQty });
      else buyerPortfolio.quantity += matchQty;
      await buyerPortfolio.save();

      // Mise à jour du portefeuille vendeur
      let sellerPortfolio = await Portfolio.findOne({ user: seller._id, stock: stock._id });
      if (sellerPortfolio) {
        sellerPortfolio.quantity -= matchQty;
        if (sellerPortfolio.quantity <= 0) await sellerPortfolio.deleteOne();
        else await sellerPortfolio.save();
      }

      // Mise à jour des cash
      buyer.cash -= transactionPrice * matchQty;
      seller.cash += transactionPrice * matchQty;
      await buyer.save();
      await seller.save();

      // Création de la transaction
      const transaction = new Transaction({
        user: buyer._id,
        stock: stock._id,
        name: stock.name,
        ticker: stock.ticker,
        type: type === 'buy' ? 'buy' : 'sell',
        quantity: matchQty,
        pricePerShare: transactionPrice,
        totalValue: transactionPrice * matchQty,
        timestamp: new Date(),
      });
      await transaction.save();

      // Mise à jour du prix de l'action
      stock.price = transactionPrice;
      await stock.save();

      // Mise à jour des ordres
      match.quantityRemaining -= matchQty;
      if (match.quantityRemaining <= 0) match.status = 'matched';
      await match.save();

      qtyToMatch -= matchQty;
    }

    order.quantityRemaining = qtyToMatch;
    if (qtyToMatch <= 0) order.status = 'matched';
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    console.error('Erreur placement ordre:', err);
    res.status(500).json({ message: 'Impossible de placer l\'ordre' });
  }
});

// Récupérer les ordres ouverts de l'utilisateur connecté
router.get('/my', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id, status: 'open' });
    res.json({ orders });
  } catch (err) {
    console.error('Erreur récupération ordres utilisateur:', err);
    res.status(500).json({ message: "Impossible de récupérer les ordres de l'utilisateur" });
  }
});

module.exports = router;
