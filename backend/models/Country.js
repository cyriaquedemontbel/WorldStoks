const mongoose = require('mongoose');

const CountrySchema = new mongoose.Schema(
	{
		name: { type: String, required: true, unique: true, trim: true },
		code: { type: String, required: true, unique: true, uppercase: true, trim: true },
		price: { type: Number, required: true, default: 1.0 }, // start at 1.000 EUR
		continent: { type: String, enum: ['Europe','Asie','Amériques','Afrique','Océanie','Moyen-Orient'], required: false },
		volume: { type: Number, required: true, default: 0 }, // total shares traded lifetime
		priceHistory: { type: [{ t: { type: Date, required: true }, p: { type: Number, required: true } }], default: [] },
		// For simplicity now; variations and chart data can be computed later
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Country', CountrySchema);


