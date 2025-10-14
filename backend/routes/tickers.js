const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');

// Récupérer la liste des tickers disponibles
router.get('/tickers', async (req, res) => {
  try {
    const stocks = await Stock.find({}, 'ticker name');
    res.json({ tickers: stocks });
  } catch (err) {
    console.error('Erreur récupération tickers:', err);
    res.status(500).json({ message: 'Impossible de récupérer les tickers' });
  }
});

module.exports = router;
