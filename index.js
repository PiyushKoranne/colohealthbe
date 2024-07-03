require('dotenv').config();
const express = require("express");
const app = express();
const cors = require("cors");
const testOrdersModel = require("./models/testOrderModel.js");
const mongoose = require("mongoose");
const { Connectdb } = require("./config/dbConn.js");
const getAnAcceptPaymentPage = require('./config/formTokenConfig.js');
const providerModel = require('./models/providerModel.js');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const upload = require("./config/uploader.js");
const { sendMail } = require('./config/mailerConfig.js');
const { registrationHTML, registrationSUB } = require('./constants.js');

app.use(cors({
	origin: ['http://192.168.16.36:5173']
}))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

Connectdb();


app.get("/colo-pay", (req, res) => {
	console.log("Generating a form token");
	getAnAcceptPaymentPage((response) => { res.status(200).json({ code: response }); console.log("RESPONSE", response) });
})

app.post("/register-new-test-data", async (req, res) => {
	try {
		console.log("Registration data", req.body);
		const newRegistration = testOrdersModel.create({
			provider: {
				fromProvider: false,
			},
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
		res.status(200).json({ success: true, msg: "registration successful" });
	} catch (error) {
		console.log(error);
		res.status(500).json({ success: false, error })
	}
})

app.post("/register-provider", upload.single("profileImage"), async (req, res) => {
	try {
		const { firstName, lastName, dob, email, phone, password } = req.body;
		const match = await providerModel.findOne({ email: email });
		if (match) return res.status(400).json({ success: false, msg: "Email is already registered" });
		const hash = await bcrypt.hash(password, 10);
		const newProvider = new providerModel({
			firstName,
			lastName,
			dob,
			email,
			phone,
			password: hash,
			accessToken: "NULL",
			joined: new Date(),
			orderCount: 0,
			profileImage: req.file.filename,
		});

		await newProvider.save();

		sendMail(email, registrationHTML(newProvider), registrationSUB)

		res.status(200).json({ success: true, msg: "User registered" });
	} catch (error) {
		console.log(error);
		res.status(500).json({ success: false, error })
	}

});

app.post("/provider-login", async (req, res) => {
	try {
		console.log(req.body);
		const { email, password, rememberMe } = req.body;
		if (!email) return res.status(400).json({ success: false, msg: "Bad request, email is missing" });
		if (!password) return res.status(400).json({ success: false, msg: "Bad request, password is missing" });

		const match = await providerModel.findOne({ email: email });
		if (!match) return res.status(400).json({ success: false, msg: "Bad request, please check your email and/or password" });

		if (await bcrypt.compare(password, match.password)) {
			const accessToken = jwt.sign({ email: email, id: match._id }, process.env.JWT_ACCESS_TOKEN_SECRET, { expiresIn: '1d' });

			match.accessToken = accessToken;
			await match.save();

			return res.status(200).json({ success: true, msg: "Login success", data: { firstName: match.firstName, lastName: match.lastName, dob: match.dob, email: match.email, phone: match.phone, orderCount: match.orderCount, joined: match.joined, accessToken: match.accessToken, profileImage: match.profileImage } });
		} else {
			return res.status(400).json({ success: false, msg: "Bad request, please check your email and/or password" });
		}

	} catch (error) {
		console.log(error);
		res.status(500).json({ success: false, error })
	}
});

app.post("/verify", async (req, res) => {
	try {
		const {accessToken} = req.body;
		if(!accessToken) return res.status(400).json({success: false});
		const decoded = await jwt.verify(accessToken, process.env.JWT_ACCESS_TOKEN_SECRET);
		if(decoded){
			const match = await providerModel.findOne({email: decoded.email});
			if(match.accessToken === accessToken){
				res.status(200).json({success: true});
			}
		}
	} catch (error) {
		console.log(error);
		res.status(500).json({ success: false, error });
	}
})

app.post("/password-reset", async (req, res) => {
	try {
		const {oldPassword, newPassword, newConfirmPassword, accessToken} = req.body;

		if(!accessToken) return res.status(401).json({success: false});
		const decoded = await jwt.verify(accessToken, process.env.JWT_ACCESS_TOKEN_SECRET);
		const match = await providerModel.findOne({email: decoded.email});
		if(!match) return res.status(401).json({success: false});
		if(await bcrypt.compare(oldPassword, match.password)){
			const hash = await bcrypt.hash(newPassword, 10);
			match.password = hash;
			await match.save();
			res.status(200).json({success: true, msg: "password changed successfully"})
		} else {
			return res.status(400).json({success: false});
		}

	} catch (error) {
		console.log(error);
		res.status(500).json({ success: false, error });
	}
})

app.get("/get-scheduled-times", async (req, res) => {
	try {
		console.log("This endpoint is called : getting scheduled times");
		const today = new Date();
		const matches = await testOrdersModel.find({ scheduledAt: { $gt: today } });
		const blockedTimes = matches.map(item => item.scheduledAt);
		res.status(200).json({ success: true, blockedTimes });
	} catch (error) {
		console.log(error);
		res.status(500).json({ success: false, error: error })
	}
})

app.post("clear-scheduled-time", async (req, res) => {
	// if payment failed
	// clear the scheduled time
	// on payment success add this info to the user registrations to confirm. 
})

app.post("get-provider-orders", async (req, res) => {
	// get providerId
	// get test orders where provider id matches
	// filter according to search, page, and itemsPerPage query values
	// send
})

mongoose.connection.once("connected", () => {
	console.log("\nConnected to Database");
	app.listen(4001, "0.0.0.0", () => {
		console.log("COLOHEALTH : Server is running.")
	})
})