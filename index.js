require('dotenv').config();
const express = require("express");
const app = express();
const cors = require("cors");
var ApiContracts = require('authorizenet').APIContracts;
var ApiControllers = require('authorizenet').APIControllers;
var utils = require('./utils.js');
var constants = require('./constants.js');
const registerModel = require("./models/testRegisterModel.js");
const mongoose = require("mongoose");
const { Connectdb } = require("./config/dbConn.js");
const { format } = require('date-fns/format');


function getAnAcceptPaymentPage(callback) {

	var merchantAuthenticationType = new ApiContracts.MerchantAuthenticationType();
	merchantAuthenticationType.setName(constants.apiLoginKey);
	merchantAuthenticationType.setTransactionKey(constants.transactionKey);

	var transactionRequestType = new ApiContracts.TransactionRequestType();
	transactionRequestType.setTransactionType(ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
	transactionRequestType.setAmount(utils.getRandomAmount());	
	
	var setting1 = new ApiContracts.SettingType();
	setting1.setSettingName('hostedPaymentButtonOptions');
	setting1.setSettingValue('{\"text\": \"Pay\"}');

	var setting2 = new ApiContracts.SettingType();
	setting2.setSettingName('hostedPaymentOrderOptions');
	setting2.setSettingValue('{\"show\": false}');

	var settingList = [];
	settingList.push(setting1);
	settingList.push(setting2);

	var alist = new ApiContracts.ArrayOfSetting();
	alist.setSetting(settingList);

	var getRequest = new ApiContracts.GetHostedPaymentPageRequest();
	getRequest.setMerchantAuthentication(merchantAuthenticationType);
	getRequest.setTransactionRequest(transactionRequestType);
	getRequest.setHostedPaymentSettings(alist);

	//console.log(JSON.stringify(getRequest.getJSON(), null, 2));
		
	var ctrl = new ApiControllers.GetHostedPaymentPageController(getRequest.getJSON());

	ctrl.execute(function(){

		var apiResponse = ctrl.getResponse();

		var response = new ApiContracts.GetHostedPaymentPageResponse(apiResponse);

		//pretty print response
		//console.log(JSON.stringify(response, null, 2));

		if(response != null) {
			if(response.getMessages().getResultCode() == ApiContracts.MessageTypeEnum.OK) {
				console.log('Hosted payment page token :');
				console.log(response.getToken());
			} else {
				//console.log('Result Code: ' + response.getMessages().getResultCode());
				console.log('Error Code: ' + response.getMessages().getMessage()[0].getCode());
				console.log('Error message: ' + response.getMessages().getMessage()[0].getText());
			}
		} else {
			console.log('Null response received');
		}
		callback(response);
	});
}

app.use(cors({
	origin:['http://192.168.16.36:5173']
}))
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

Connectdb();


app.get("/colo-pay", (req, res)=>{
	console.log("Generating a form token")
	getAnAcceptPaymentPage((response)=>{ res.status(200).json({code: response}); console.log("RESPONSE", response)});
})
// 
app.post("/register-new-test-data", async (req, res) => {
	console.log("Registration data", req.body);
	const newRegistration = registerModel.create({
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		streetAddress: req.body.streetAddress,
		city: req.body.city,
		state: req.body.state,
		zip: req.body.zip,
		phone: req.body.phone,
		email: req.body.email,
		dob: req.body.dob,
		race: req.body.race,
		ethnicity: req.body.ethnicity,
		registrationConsent: req.body.confirm,
		scheduledAt: req.body.scheduledAt
	});
	await (await newRegistration).save();
	res.status(200).json({success: true, msg: "registration successful"});
})

app.post("/register-user", async (req, res) => {
	
});

app.post("/login-user", async (req, res) => {

});

app.get("/get-scheduled-times", async (req, res) => {
	try {
		// 
		console.log("This endpoint is called : getting scheduled times");
		const today = new Date();
		const matches = await registerModel.find({scheduledAt:{$gt: today}});
		const blockedTimes = matches.map(item => item.scheduledAt);
		res.status(200).json({success: true, blockedTimes});		
	} catch (error) {
		console.log(error);
		res.status(500).json({success: false, error: error})
	}
})

app.post("clear-scheduled-time", async (req, res) => {
	
})

mongoose.connection.once("connected", ()=>{

	console.log("Connected to Database");
	app.listen(4001, "0.0.0.0", ()=>{
		console.log("COLOHEALTH : Server is running.")
	})

})