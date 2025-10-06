require('dotenv').config(); // Charge les variables d'environnement dès le démarrage

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Pour gérer les requêtes entre front et back
const app = express();
const PORT = process.env.PORT || 5000; // Le port de notre serveur, 5000 par défaut

// --- Middlewares ---
app.use(express.json()); // Permet à Express de lire le JSON envoyé dans les requêtes
app.use(cors()); // Active CORS pour toutes les requêtes

// --- Connexion à la base de données MongoDB ---
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connexion à MongoDB réussie !'))
.catch(err => console.error('Erreur de connexion à MongoDB :', err));

// --- Routes (API Endpoints) ---
// Routes API
app.use('/api/countries', require('./routes/countries'));
app.use('/api/trades', require('./routes/trades'));
app.use('/api/auth', require('./routes/auth'));

// Route de test
app.get('/', (req, res) => {
    res.send('API World Stocks fonctionne !');
});

// --- Démarrage du serveur ---
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});