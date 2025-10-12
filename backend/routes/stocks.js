const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');
const auth = require('../middleware/auth');

// 🔹 GET — Récupérer tous les stocks
router.get('/', async (req, res) => {
    try {
        const stocks = await Stock.find();
        res.json(stocks);
    } catch (err) {
        console.error('Erreur récupération stocks:', err);
        res.status(500).json({ message: 'Impossible de récupérer les stocks' });
    }
});

// 🔹 POST — Ajouter un nouveau stock (admin uniquement)
router.post('/', auth, async (req, res) => {
    try {
        if (!req.user.isAdmin) return res.status(403).json({ message: 'Accès refusé' });
        const { ticker, name, price } = req.body;
        if (!ticker || !name || typeof price !== 'number') {
            return res.status(400).json({ message: 'Données invalides' });
        }

        const stock = new Stock({ ticker, name, price });
        await stock.save();
        res.json(stock);
    } catch (err) {
        console.error('Erreur création stock:', err);
        res.status(500).json({ message: 'Impossible de créer le stock' });
    }
});

// 🔹 PUT — Mettre à jour un stock (admin uniquement)
router.put('/:id', auth, async (req, res) => {
    try {
        if (!req.user.isAdmin) return res.status(403).json({ message: 'Accès refusé' });
        const stock = await Stock.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!stock) return res.status(404).json({ message: 'Stock introuvable' });
        res.json(stock);
    } catch (err) {
        console.error('Erreur mise à jour stock:', err);
        res.status(500).json({ message: 'Impossible de mettre à jour le stock' });
    }
});

// 🔹 DELETE — Supprimer un stock (admin uniquement)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (!req.user.isAdmin) return res.status(403).json({ message: 'Accès refusé' });
        const stock = await Stock.findByIdAndDelete(req.params.id);
        if (!stock) return res.status(404).json({ message: 'Stock introuvable' });
        res.json({ message: 'Stock supprimé' });
    } catch (err) {
        console.error('Erreur suppression stock:', err);
        res.status(500).json({ message: 'Impossible de supprimer le stock' });
    }
});

// 🧠 Ancienne version supprimée : updateMarketWithAI() modifiait les prix

// 🔹 Nouvelle route — Actualiser le marché sans changer les prix
router.post('/update-market', async (req, res) => {
    try {
        // On se contente de recharger les stocks depuis la base, sans modification
        const stocks = await Stock.find();

        res.json({
            success: true,
            updated: stocks.length,
            message: "Marché actualisé sans modification de prix",
            stocks,
        });
    } catch (err) {
        console.error('Erreur update-market:', err);
        res.status(500).json({ message: 'Impossible de mettre à jour le marché' });
    }
});

module.exports = router;
