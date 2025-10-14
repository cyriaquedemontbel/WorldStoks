const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');

// Annuler un ordre ouvert
router.post('/cancel/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Ordre non trouvé' });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé à annuler cet ordre' });
    }
    if (order.status !== 'open') {
      return res.status(400).json({ message: 'Ordre déjà exécuté ou annulé' });
    }
    order.status = 'cancelled';
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    console.error('Erreur annulation ordre:', err);
    res.status(500).json({ message: 'Impossible d\'annuler l\'ordre' });
  }
});

module.exports = router;
