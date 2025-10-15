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

        const stock = new Stock({ 
            ticker, 
            name, 
            price, 
            priceAtOpen: price, // prix d'ouverture initial
            change: 0,
            changePercent: 0,
            circulatingSupply: req.body.circulating_supply ?? req.body.circulatingSupply ?? stock?.circulatingSupply
        });

        await stock.save();

        // If admin created the stock, give admin the circulating supply in portfolio and create a sell order
        try {
            const Order = require('../models/Order');
            const Portfolio = require('../models/Portfolio');
            const adminUser = req.user;
            const qty = Number(stock.circulatingSupply || stock.maxSupply || 0);
            if (adminUser && qty > 0) {
                // Add to portfolio
                await Portfolio.create({ user: adminUser._id, stock: stock._id, quantity: qty });

                // Create admin sell order
                const order = new Order({
                    user: adminUser._id,
                    stock: stock._id,
                    type: 'sell',
                    price: price,
                    quantity: qty,
                    quantityRemaining: qty,
                    status: 'open'
                });
                await order.save();
            }
        } catch (e) {
            console.warn('Erreur création ordre/admin portfolio:', e);
        }

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

// 🔹 POST — Actualiser le marché et calculer les variations
router.post('/update-market', async (req, res) => {
    try {
        const stocks = await Stock.find();

        const updatedStocks = await Promise.all(stocks.map(async (stock) => {
            // Prix de référence : priceAtOpen
            const basePrice = stock.priceAtOpen ?? stock.price;

            // ⚡ Simulation d’évolution du prix pour rendre le pourcentage dynamique
            const newPrice = stock.price * (1 + (Math.random() - 0.5) * 0.02); // ±1% aléatoire
            stock.price = Number(newPrice.toFixed(2));

            const change = Number((stock.price - basePrice).toFixed(2));
            const changePercent = basePrice > 0 ? Number(((change / basePrice) * 100).toFixed(2)) : 0;

            // Mise à jour des champs persistants
            stock.priceAtOpen = stock.priceAtOpen ?? stock.price;
            stock.change = change;
            stock.changePercent = changePercent;

            await stock.save();
            return stock;
        }));

        res.json({
            success: true,
            updated: updatedStocks.length,
            stocks: updatedStocks,
        });
    } catch (err) {
        console.error('Erreur update-market:', err);
        res.status(500).json({ message: 'Impossible de mettre à jour le marché' });
    }
});

module.exports = router;
