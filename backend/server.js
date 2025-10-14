// Mise à jour automatique des prix des actions toutes les 10 secondes
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connexion à MongoDB réussie !');
    })
    .catch(err => console.error('Erreur de connexion à MongoDB :', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stocks', require('./routes/stocks'));
app.use('/api/trades', require('./routes/trades'));
app.use('/api/user', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/orderbook', require('./routes/orderbook'));
app.use('/api/tickers', require('./routes/tickers'));

// Route de test
app.get('/', (req, res) => res.send('API World Stocks fonctionne !'));

// Gestion globale des erreurs (catch-all)
app.use((err, req, res, next) => {
    console.error('Erreur serveur :', err);
    res.status(500).json({ error: 'Erreur serveur interne' });
});


// Mise à jour automatique des prix toutes les 10 secondes
const Stock = require('./models/Stock');
const Transaction = require('./models/Transaction');

setInterval(async () => {
    try {
        // Récupère les actions
        const stocks = await Stock.find({});
        let updated = false;
        for (const stock of stocks) {
            // Vérifie s'il y a eu des transactions sur cette action dans les 10 dernières secondes
            const lastTransaction = await Transaction.findOne({ stock: stock._id })
                .sort({ timestamp: -1 });
            if (lastTransaction && lastTransaction.timestamp > new Date(Date.now() - 10000)) {
                // Met à jour le prix de l'action avec le prix de la dernière transaction
                stock.price = lastTransaction.pricePerShare;
                // Met à jour le changement et le pourcentage
                if (!stock.priceAtOpen) stock.priceAtOpen = stock.price;
                stock.change = stock.price - stock.priceAtOpen;
                stock.changePercent = ((stock.price - stock.priceAtOpen) / stock.priceAtOpen) * 100;
                await stock.save();
                updated = true;
            }
        }
        if (updated) {
            console.log('Prix des actions mis à jour automatiquement.');
        }
    } catch (err) {
        console.error('Erreur lors de la mise à jour automatique des prix :', err);
    }
}, 10000);

app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
