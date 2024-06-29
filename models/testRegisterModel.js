const mongoose = require("mongoose");

const RegisterSchema = new mongoose.Schema({
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

const registerModel = mongoose.model("Registration", RegisterSchema);

module.exports = registerModel;