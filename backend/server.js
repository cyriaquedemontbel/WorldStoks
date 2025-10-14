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

app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
