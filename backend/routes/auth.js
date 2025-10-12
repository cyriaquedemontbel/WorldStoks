const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// ==========================
// Register
// ==========================
router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, username, birthDate, gender, consent } = req.body;

        // Vérifier que tous les champs obligatoires sont présents
        if (!email || !password || !firstName || !lastName || !username || !birthDate || consent !== true) {
            return res.status(400).json({ message: 'Champs obligatoires manquants ou consentement non donné' });
        }

        // Vérifier unicité email et username
        if (await User.findOne({ email })) return res.status(400).json({ message: 'Email déjà utilisé' });
        if (await User.findOne({ username })) return res.status(400).json({ message: 'Nom d’utilisateur déjà utilisé' });

        // Créer le nouvel utilisateur
        const user = new User({
            email,
            password,
            firstName,
            lastName,
            username,
            birthDate,
            gender: gender || 'other',
            consent
        });

        await user.save();

        // Générer un token JWT
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur serveur lors de l’inscription' });
    }
});

// ==========================
// Login
// ==========================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Utilisateur non trouvé' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Mot de passe incorrect' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// ==========================
// Get current user
// ==========================
router.get('/me', auth, async (req, res) => {
    res.json(req.user);
});

module.exports = router;
