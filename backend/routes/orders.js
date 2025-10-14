const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const Stock = require('../models/Stock');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

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
      // Exclure les ordres appartenant à l'utilisateur qui place l'ordre
      matchedOrders = await Order.find({
        stock: stock._id,
        type: 'sell',
        price: { $lte: price },
        status: 'open',
        user: { $ne: req.user._id }
      }).sort({ price: 1, timestamp: 1 }).populate('user');
    } else {
      // Cherche les ordres d'achat ouverts au prix >= order.price
      // Exclure les ordres appartenant à l'utilisateur qui place l'ordre
      matchedOrders = await Order.find({
        stock: stock._id,
        type: 'buy',
        price: { $gte: price },
        status: 'open',
        user: { $ne: req.user._id }
      }).sort({ price: -1, timestamp: 1 }).populate('user');
    }

    for (const match of matchedOrders) {
      // Défensive: si un ordre appartient au même utilisateur (au cas où), on l'ignore
      if (String(match.user?._id || match.user) === String(req.user._id)) continue;
      if (qtyToMatch <= 0) break;
      const matchQty = Math.min(qtyToMatch, match.quantityRemaining);
      const transactionPrice = match.price;

      // Mise à jour des portefeuilles et cash
      let buyer, seller;
      if (type === 'buy') {
        buyer = req.user;
        // match.user is populated above; if not, fetch it
        seller = match.user && match.user._id ? match.user : await (async () => {
          try { return await User.findById(match.user); } catch { return null; }
        })();
      } else {
        buyer = match.user && match.user._id ? match.user : await (async () => {
          try { return await User.findById(match.user); } catch { return null; }
        })();
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
      // Créer une transaction pour l'acheteur et une pour le vendeur afin que les deux voient l'opération
      const buyerTransaction = new Transaction({
        user: buyer._id,
        stock: stock._id,
        name: stock.name,
        ticker: stock.ticker,
        type: 'buy',
        quantity: matchQty,
        pricePerShare: transactionPrice,
        totalValue: transactionPrice * matchQty,
        timestamp: new Date(),
      });
      const sellerTransaction = new Transaction({
        user: seller._id,
        stock: stock._id,
        name: stock.name,
        ticker: stock.ticker,
        type: 'sell',
        quantity: matchQty,
        pricePerShare: transactionPrice,
        totalValue: transactionPrice * matchQty,
        timestamp: new Date(),
      });
      await Promise.all([buyerTransaction.save(), sellerTransaction.save()]);

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

// Récupérer tous les ordres de l'admin
router.get('/admin', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Accès refusé' });
    const orders = await Order.find({ user: req.user._id }).populate('stock');
    res.json({ orders });
  } catch (err) {
    console.error('Erreur récupération ordres admin:', err);
    res.status(500).json({ message: "Impossible de récupérer les ordres de l'admin" });
  }
});

// Supprimer un ordre par son id (admin ou propriétaire)
router.delete('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Ordre non trouvé' });
    // Seul l'admin ou le propriétaire peut supprimer
    if (!req.user.isAdmin && String(order.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    await order.deleteOne();
    res.json({ success: true, message: 'Ordre supprimé' });
  } catch (err) {
    console.error('Erreur suppression ordre:', err);
    res.status(500).json({ message: "Impossible de supprimer l'ordre" });
  }
});

module.exports = router;

// Endpoint public pour récupérer les ordres ouverts (utilisé par le frontend carnet d'ordres)
router.get('/all', async (req, res) => {
  try {
    // Ne renvoyer que les ordres dont le statut est 'open' pour ne pas afficher les ordres déjà exécutés
    const orders = await Order.find({ status: 'open' }).populate('user', 'email username').populate('stock', 'ticker name');
    res.json({ orders: Array.isArray(orders) ? orders : [] });
  } catch (err) {
    console.error('Erreur récupération orders all:', err);
    res.status(500).json({ message: 'Impossible de récupérer les ordres' });
  }
});
