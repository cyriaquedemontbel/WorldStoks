require('dotenv').config();
const mongoose = require('mongoose');
const Country = require('../models/Country');

const DEFAULT_COUNTRIES = [
	{ name: 'France', code: 'FR', price: 1.0, continent: 'Europe' },
	{ name: 'United States', code: 'US', price: 1.0, continent: 'Amériques' },
	{ name: 'Germany', code: 'DE', price: 1.0, continent: 'Europe' },
	{ name: 'China', code: 'CN', price: 1.0, continent: 'Asie' },
	{ name: 'Brazil', code: 'BR', price: 1.0, continent: 'Amériques' },
	{ name: 'India', code: 'IN', price: 1.0, continent: 'Asie' },
];

async function run() {
	await mongoose.connect(process.env.MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});
	const count = await Country.countDocuments();
	if (count === 0) {
		await Country.insertMany(DEFAULT_COUNTRIES);
		console.log('Seeded default countries');
	} else {
		console.log('Countries already present, skipping seed');
	}
	await mongoose.disconnect();
}

run().catch(err => {
	console.error(err);
	process.exit(1);
});


