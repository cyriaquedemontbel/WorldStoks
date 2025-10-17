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
  const session = await Order.startSession();
  try {
    session.startTransaction();
    const { ticker, type, price, quantity } = req.body;
    if (!ticker || !type || !price || !quantity) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Paramètres manquants' });
    }
    if (!['buy', 'sell'].includes(type)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Type d\'ordre invalide' });
    }
    // Log tous les tickers existants pour debug
    const allStocks = await Stock.find({}).session(session);
    const allTickers = allStocks.map(s => s.ticker);
    console.log('[ORDERS] Tickers existants:', allTickers, '| Ticker reçu:', ticker);
    // Recherche insensible à la casse
    let stock = await Stock.findOne({ ticker: { $regex: `^${ticker}$`, $options: 'i' } }).session(session);
    if (!stock) {
      // Correction automatique si faute de frappe (distance de Levenshtein <= 1)
      function levenshtein(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
          for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1).toLowerCase() === a.charAt(j - 1).toLowerCase()) {
              matrix[i][j] = matrix[i - 1][j - 1];
            } else {
              matrix[i][j] = Math.min(
                matrix[i - 1][j - 1] + 1, // substitution
                matrix[i][j - 1] + 1,     // insertion
                matrix[i - 1][j] + 1      // deletion
              );
            }
          }
        }
        return matrix[b.length][a.length];
      }
      let best = null, minDist = 99;
      for (const t of allTickers) {
        const dist = levenshtein(ticker, t);
        if (dist < minDist) { minDist = dist; best = t; }
      }
      if (minDist <= 1) {
        stock = await Stock.findOne({ ticker: best }).session(session);
        console.warn(`[ORDERS] Correction automatique du ticker : ${ticker} => ${best}`);
      }
      if (!stock) {
        await session.abortTransaction();
        session.endSession();
        let suggestion = '';
        if (minDist <= 2 && best) suggestion = ` (voulez-vous dire : ${best} ?)`;
        return res.status(404).json({ message: `Stock non trouvé pour ticker : ${ticker}${suggestion}` });
      }
    }

    // Re-fetch request user inside session to ensure consistent writes
    const reqUser = await User.findById(req.user._id).session(session);

    // Vérification des fonds ou des actions disponibles
    if (type === 'buy' && reqUser.cash < price * quantity) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Fonds insuffisants' });
    }
    if (type === 'sell') {
      const portfolio = await Portfolio.findOne({ user: reqUser._id, stock: stock._id }).session(session);
      if (!portfolio) {
        console.error(`[ORDERS] Aucun portefeuille trouvé pour user=${reqUser._id} et stock=${stock._id} (ticker=${ticker})`);
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Vous ne possédez aucune action ${stock.ticker}` });
      }
      if (portfolio.quantity < quantity) {
        console.error(`[ORDERS] Quantité insuffisante pour user=${reqUser._id} sur stock=${stock._id} (ticker=${ticker}), demandé=${quantity}, dispo=${portfolio.quantity}`);
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Pas assez d'actions à vendre (${portfolio.quantity} dispo)` });
      }
    }

    // Création de l'ordre (doit être créé within session)
    let order = new Order({
      user: reqUser._id,
      stock: stock._id,
      type,
      price,
      quantity,
      quantityRemaining: quantity,
      status: 'open',
    });
    await order.save({ session });

    // Matching automatique
    let matchedOrders = [];
    let qtyToMatch = order.quantityRemaining;
    if (type === 'buy') {
      matchedOrders = await Order.find({
        stock: stock._id,
        type: 'sell',
        price: { $lte: price },
        status: 'open',
        user: { $ne: reqUser._id }
      }).session(session).sort({ price: 1, timestamp: 1 }).populate('user');
    } else {
      matchedOrders = await Order.find({
        stock: stock._id,
        type: 'buy',
        price: { $gte: price },
        status: 'open',
        user: { $ne: reqUser._id }
      }).session(session).sort({ price: -1, timestamp: 1 }).populate('user');
    }

    for (const match of matchedOrders) {
      if (String(match.user?._id || match.user) === String(reqUser._id)) continue;
      if (qtyToMatch <= 0) break;
      const matchQty = Math.min(qtyToMatch, match.quantityRemaining);
      const transactionPrice = match.price;

      // Determine buyer and seller documents within session
      let buyer, seller;
      if (type === 'buy') {
        buyer = await User.findById(reqUser._id).session(session);
        seller = match.user && match.user._id ? await User.findById(match.user._id).session(session) : await User.findById(match.user).session(session);
      } else {
        buyer = match.user && match.user._id ? await User.findById(match.user._id).session(session) : await User.findById(match.user).session(session);
        seller = await User.findById(reqUser._id).session(session);
      }

      // Mise à jour du portefeuille acheteur
      let buyerPortfolio = await Portfolio.findOne({ user: buyer._id, stock: stock._id }).session(session);
      if (!buyerPortfolio) buyerPortfolio = new Portfolio({ user: buyer._id, stock: stock._id, quantity: matchQty });
      else buyerPortfolio.quantity += matchQty;
      await buyerPortfolio.save({ session });

      // Mise à jour du portefeuille vendeur
      let sellerPortfolio = await Portfolio.findOne({ user: seller._id, stock: stock._id }).session(session);
      if (sellerPortfolio) {
        sellerPortfolio.quantity -= matchQty;
        if (sellerPortfolio.quantity <= 0) await sellerPortfolio.deleteOne({ session });
        else await sellerPortfolio.save({ session });
      }

      // Mise à jour des cash
      buyer.cash -= transactionPrice * matchQty;
      seller.cash += transactionPrice * matchQty;
      await buyer.save({ session });
      await seller.save({ session });

      // Création de la transaction
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
      await Promise.all([buyerTransaction.save({ session }), sellerTransaction.save({ session })]);

      // Mise à jour du prix de l'action
      stock.price = transactionPrice;
      await stock.save({ session });

      // Mise à jour des ordres
      match.quantityRemaining -= matchQty;
      if (match.quantityRemaining <= 0) match.status = 'matched';
      await match.save({ session });

      qtyToMatch -= matchQty;
    }

    order.quantityRemaining = qtyToMatch;
    if (qtyToMatch <= 0) order.status = 'matched';
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, order });
  } catch (err) {
    try { await session.abortTransaction(); } catch (e) { /* ignore */ }
    session.endSession();
    // Log full error for debugging
    console.error('Erreur placement ordre:', err && err.stack ? err.stack : err);
    const isProd = process.env.NODE_ENV === 'production';
    // In development, include the error message to help debug. In prod, keep generic.
    if (!isProd) {
      res.status(500).json({ message: 'Impossible de placer l\'ordre', detail: err && err.message ? err.message : String(err) });
    } else {
      res.status(500).json({ message: 'Impossible de placer l\'ordre' });
    }
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
    // Si l'utilisateur est admin, supprimer tous ses ordres ouverts sur ce stock
    if (req.user.isAdmin) {
      const result = await Order.deleteMany({ user: req.user._id, stock: order.stock, status: 'open' });
      res.json({ success: true, message: `Tous les ordres ouverts de l'admin pour ce stock supprimés (${result.deletedCount})` });
    } else {
      await order.deleteOne();
      res.json({ success: true, message: 'Ordre supprimé' });
    }
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
