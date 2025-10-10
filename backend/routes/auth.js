const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// --- Auth middleware ---
function authRequired(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Non autorisé' });
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = payload.userId;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Jeton invalide' });
  }
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { pseudo, email, password } = req.body;
    if (!pseudo || !email || !password) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
    }
    // Vérifie si l'utilisateur existe déjà (email ou pseudo)
    const existingUser = await User.findOne({ $or: [ { email }, { pseudo } ] });
    if (existingUser) {
      const reason = existingUser.email === email ? 'Email déjà utilisé.' : 'Pseudo déjà utilisé.';
      return res.status(400).json({ message: reason });
    }
    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    // Création de l'utilisateur
    const user = new User({ pseudo, email, password: hashedPassword });
    await user.save();
    res.json({ message: 'Utilisateur créé avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'inscription.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Utilisateur non trouvé.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mot de passe incorrect.' });
    }
    // Génère un token JWT (optionnel)
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, pseudo: user.pseudo, email: user.email, cashBalanceEur: user.cashBalanceEur } });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
  }
});

// GET /api/auth/me - get current user profile
router.get('/me', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    res.json({
      id: user._id,
      pseudo: user.pseudo,
      email: user.email,
      avatarUrl: user.avatarUrl,
      cashBalanceEur: user.cashBalanceEur,
      holdings: user.holdings // Ajouté pour le portefeuille
    });
  } catch (error) {
    console.error('Erreur /me:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// PUT /api/auth/me - update pseudo/email/avatar
router.put('/me', authRequired, async (req, res) => {
  try {
    const { pseudo, email, avatarUrl } = req.body;
    // Check duplicates if changing
    if (email) {
      const dup = await User.findOne({ email, _id: { $ne: req.userId } });
      if (dup) return res.status(400).json({ message: 'Email déjà utilisé.' });
    }
    if (pseudo) {
      const dup = await User.findOne({ pseudo, _id: { $ne: req.userId } });
      if (dup) return res.status(400).json({ message: 'Pseudo déjà utilisé.' });
    }
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { ...(pseudo ? { pseudo } : {}), ...(email ? { email } : {}), ...(avatarUrl ? { avatarUrl } : {}) } },
      { new: true }
    );
    res.json({ id: user._id, pseudo: user.pseudo, email: user.email, avatarUrl: user.avatarUrl });
  } catch (error) {
    console.error('Erreur update /me:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', authRequired, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Champs requis.' });
    const user = await User.findById(req.userId).select('+password');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(400).json({ message: 'Mot de passe actuel incorrect.' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Mot de passe mis à jour.' });
  } catch (error) {
    console.error('Erreur change-password:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

module.exports = router;
