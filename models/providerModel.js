const mongoose = require("mongoose");

const ProviderSchema = new mongoose.Schema({
	firstName: String,
	lastName: String,
	dob: Date,
	email: String,
	phone: String,
	orderCount: Number,
	joined: Date,
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

