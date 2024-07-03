const mongoose = require("mongoose");

const TestOrderSchema = new mongoose.Schema({
	provider:{
		fromProvider: Boolean,
		providerId: mongoose.Schema.Types.ObjectId
	},
	firstName: String,
	lastName: String,
	streetAddress: String,
	city: String,
	state: String,
	zip: String,
	phone: String,
	email: String,
	dob: String,
	race: String,
	ethnicity: String,
	registrationConsent: {
		type: Boolean,
		default: false,
	},
	scheduledAt: Date,
})

const testOrdersModel = mongoose.model("TestOrders", TestOrderSchema);

module.exports = testOrdersModel;