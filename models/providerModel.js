const mongoose = require("mongoose");

const ProviderSchema = new mongoose.Schema({
	firstName: String,
	lastName: String,
	dob: String,
	email: String,
	phone: String,
	orderCount: Number,
	joined: String,
	password: String,
	accessToken: String,
	profileImage: String,
	status: {
		type:String,
		enum:['ACTIVE','DORMANT','UNVERIFIED'],
		default:'UNVERIFIED'
	}
})

const providerModel = mongoose.model("Provider", ProviderSchema);

module.exports = providerModel;

