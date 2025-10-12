// routes/user.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');

// ===================================
// Récupérer l'utilisateur et son portefeuille complet
// ===================================
router.get('/data', auth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Utilisateur non authentifié' });

    const userPortfolio = await Portfolio.find({ user: req.user._id }).populate('stock');

    const portfolioObject = {};
    userPortfolio.forEach(p => {
      if (p.stock) {
        portfolioObject[p.stock.ticker] = {
          quantity: p.quantity,
          price: p.stock.price
        };
      }
    });

    res.json({
      email: req.user.email,
      username: req.user.username,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      birthDate: req.user.birthDate,
      gender: req.user.gender,
      consent: req.user.consent,
      cash: req.user.cash,
      isAdmin: req.user.isAdmin,
      portfolio: portfolioObject
    });
  } catch (err) {
    console.error('Erreur récupération utilisateur:', err);
    res.status(500).json({ message: 'Impossible de récupérer l’utilisateur' });
  }
});

// ===================================
// Historique des transactions
// ===================================
router.get('/history', auth, async (req, res) => {
  try {
    const history = await Transaction.find({ user: req.user._id }).populate('stock');
    res.json(history ?? []);
  } catch (err) {
    console.error('Erreur récupération historique:', err);
    res.status(500).json({ message: 'Impossible de récupérer l’historique' });
  }
});

// ===================================
// Gestion des fonds (dépôt / retrait)
// ===================================
router.post('/funds', auth, async (req, res) => {
  try {
    const { amount, type } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Montant invalide' });
    }

    if (type === 'deposit') {
      req.user.cash += amount;
    } else if (type === 'withdraw') {
      if (req.user.cash < amount) return res.status(400).json({ message: 'Fonds insuffisants' });
      req.user.cash -= amount;
    } else {
      return res.status(400).json({ message: 'Type de transaction invalide' });
    }

    await req.user.save();

    const userPortfolio = await Portfolio.find({ user: req.user._id }).populate('stock');
    const portfolioObject = {};
    userPortfolio.forEach(p => {
      if (p.stock) {
        portfolioObject[p.stock.ticker] = {
          quantity: p.quantity,
          price: p.stock.price
        };
      }
    });

    res.json({
      email: req.user.email,
      username: req.user.username,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      birthDate: req.user.birthDate,
      gender: req.user.gender,
      consent: req.user.consent,
      cash: req.user.cash,
      isAdmin: req.user.isAdmin,
      portfolio: portfolioObject
    });
  } catch (err) {
    console.error('Erreur gestion fonds:', err);
    res.status(500).json({ message: 'Impossible de mettre à jour les fonds' });
  }
});

// ===================================
// Mettre à jour les infos utilisateur
// ===================================
router.put('/update', auth, async (req, res) => {
  try {
    const { firstName, lastName, username, birthDate, gender, password } = req.body;

    if (!req.user) return res.status(401).json({ message: 'Utilisateur non authentifié' });

    // Mettre à jour les champs si fournis
    if (firstName) req.user.firstName = firstName;
    if (lastName) req.user.lastName = lastName;
    if (username) req.user.username = username;
    if (birthDate) req.user.birthDate = birthDate;
    if (gender) req.user.gender = gender;

    if (password) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      req.user.password = await bcrypt.hash(password, salt);
    }

    await req.user.save();

    res.json({
      email: req.user.email,
      username: req.user.username,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      birthDate: req.user.birthDate,
      gender: req.user.gender,
      consent: req.user.consent,
      cash: req.user.cash,
      isAdmin: req.user.isAdmin,
      portfolio: req.user.portfolio || {},
    });
  } catch (err) {
    console.error('Erreur mise à jour utilisateur:', err);
    res.status(500).json({ message: 'Impossible de mettre à jour l’utilisateur' });
  }
});


module.exports = router;
