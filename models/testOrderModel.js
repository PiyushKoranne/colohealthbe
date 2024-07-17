const mongoose = require("mongoose");

const TestOrderSchema = new mongoose.Schema({
	orderId: String,
	scheduledAt : String,
	registrationConsent : Boolean,
	firstName : String,
	lastName : String,
	dob : String,
	gender: String,
	streetAddress : String,
	city : String,
	state : String,
	zip : String,
	phone : String,
	email : String,
	race : String,
	ethnicity : String,
	paymentConfirmed: Boolean,
	paymentInformation:{
		status: {
			type: String,
			enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']
		},	
		transactionId:String,
		paymentVerificationHash: String,
	},
	providerId: String
})

const testOrdersModel = mongoose.model("TestOrders", TestOrderSchema);

module.exports = testOrdersModel;
