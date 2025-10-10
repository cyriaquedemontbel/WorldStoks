const mongoose = require('mongoose');

const HoldingSchema = new mongoose.Schema(
	{
		country: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
		quantity: { type: Number, required: true, default: 0 },
	},
	{ _id: false }
);

const TransactionSchema = new mongoose.Schema(
	{
		type: { type: String, enum: ['BUY', 'SELL'], required: true },
		country: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
		quantity: { type: Number, required: true },
		priceAtExecution: { type: Number, required: true },
	},
	{ timestamps: true }
);

const UserSchema = new mongoose.Schema(
	{
		email: { type: String, required: true, unique: true, lowercase: true, trim: true },
		pseudo: { type: String, required: true, unique: true, trim: true },
		password: { type: String, required: true, select: false },
		avatarUrl: { type: String },
		cashBalanceEur: { type: Number, required: true, default: 10000 },
		holdings: { type: [HoldingSchema], default: [] },
		transactions: { type: [TransactionSchema], default: [] },
	},
	{ timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);


