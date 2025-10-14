const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const Stock = require('../models/Stock');

// Récupérer le carnet d'ordres pour une action
router.get('/book/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const stock = await Stock.findOne({ ticker });
    if (!stock) {
      // Si le stock n'existe pas, retourne un carnet vide
      return res.json({ bids: [], asks: [] });
    }

    // Ordres d'achat (bids) triés du plus élevé au plus bas
    const bids = await Order.find({ stock: stock._id, type: 'buy', status: 'open' })
      .sort({ price: -1, timestamp: 1 });
    // Ordres de vente (asks) triés du plus bas au plus élevé
    const asks = await Order.find({ stock: stock._id, type: 'sell', status: 'open' })
      .sort({ price: 1, timestamp: 1 });

    res.json({ bids, asks });
  } catch (err) {
    console.error('Erreur carnet d\'ordres:', err);
    res.status(500).json({ message: 'Impossible de récupérer le carnet d\'ordres' });
  }
});

module.exports = router;
