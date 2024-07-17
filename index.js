require('dotenv').config();
const path = require("path");
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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("static"));

Connectdb();


app.get("/colo-pay", (req, res) => {
	console.log("Generating a form token");
	getAnAcceptPaymentPage((response) => { res.status(200).json({ code: response }); console.log("RESPONSE", response) });
})

app.post("/verify-payment", async (req, res) => {
	try {
		const { pv, regId } = req.body;
		const match = await testOrdersModel.findOne({ _id: regId });
		if (!match) return res.status(400).json({ success: true, msg: "bad request, no match found" });
		if (match.paymentInformation.paymentVerificationHash !== pv) {
			return res.status(400).json({ success: true, msg: "bad request, no verification token found" });
		}
		const decoded = await jwt.verify(match.paymentInformation.paymentVerificationHash, "Test101Credentials");
		if (!decoded || decoded.regId !== match._id.toString()) return res.status(400).json({ success: true, msg: "bad request, verification token invalid" });
		await testOrdersModel.findOneAndUpdate({ _id: regId }, {
			$set: {
				'paymentInformation.status': "COMPLETED",
				'paymentInformation.transactionId': "COMPLETED__"+match._id.toString(),
				'paymentInformation.paymentVerificationHash': "COMPLETED",
				paymentConfirmed: true,
			}
		})
		return res.status(200).json({ success: true, data: { scheduledAt: match.scheduledAt } });

	} catch (error) {
		console.log(error);
		res.status(500).json({ success: false, error })
	}
})


app.post("/register-new-test-data", async (req, res) => {
	try {
		console.log("Registration data", req.body);
		const count = await testOrdersModel.countDocuments();


		const {providerId} = req.body;
		let checkProvider = false;
		if(providerId){
			const providerMatch = await providerModel.findOne({_id: providerId});
			if(providerMatch) checkProvider = true;
		}

		const newRegistration = new testOrdersModel({
			providerId: (req.body.providerId && checkProvider) ? req.body.providerId : 'NULL',
			orderId: `${11500 + count + 1}`,
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			streetAddress: req.body.streetAddress,
			city: req.body.city,
			state: req.body.state,
			zip: req.body.zip,
			phone: req.body.phone,
			email: req.body.email,
			dob: req.body.dob,
			gender: req.body.gender,
			race: req.body.race,
			ethnicity: req.body.ethnicity,
			registrationConsent: req.body.confirm,
			scheduledAt: req.body.scheduledAt,
			paymentConfirmed: false,
			paymentInformation: {
				status: "PENDING",
				transactionId: "PENDING"
			}
		});
		await newRegistration.save();

		const paymentVerificationToken = await jwt.sign({ regId: newRegistration._id }, "Test101Credentials");
		await testOrdersModel.findOneAndUpdate({ _id: newRegistration._id }, {
			$set: {
				'paymentInformation.paymentVerificationHash': paymentVerificationToken
			}
		});

		getAnAcceptPaymentPage((error, response) => {
			if (error) {
				throw error;
			} else {
				res.status(200).json({ code: response.token, regid: response.regid })
			}
		}, newRegistration._id, paymentVerificationToken);

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

			return res.status(200).json({ success: true, msg: "Login success", data: { _id: match._id, firstName: match.firstName, lastName: match.lastName, dob: match.dob, email: match.email, phone: match.phone, orderCount: match.orderCount, joined: match.joined, accessToken: match.accessToken, profileImage: match.profileImage } });
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

function parseDateString(dateString) {
  const [datePart, timePart] = dateString.split(', ');
  const [day, month, year] = datePart.split('/').map(Number);
  const [hours, minutes, seconds] = timePart.split(':').map(Number);

  // Note: Month is 0-based in JavaScript Date, so we subtract 1 from the month
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

app.get("/get-scheduled-times", async (req, res) => {
	try {
		console.log("This endpoint is called : getting scheduled times");
		const today = new Date();
		const matches = await testOrdersModel.find({ paymentConfirmed: true });
		const finalDates =  matches.filter(item => {
			let tempDate = parseDateString(item.scheduledAt);
			let today = new Date();
			if(tempDate > today) return true;
			return false;
		})
		const blockedTimes = finalDates.map(item => item.scheduledAt);
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


// Serve index.html for any subpath under /app
app.get("/provider-login", (req, res) => {
    res.sendFile(path.join(__dirname, "static/index.html"));
});

app.get("/provider-portal", (req, res) => {
    res.sendFile(path.join(__dirname, "static/index.html"));
});


app.get("/thank-you", (req, res) => {
    res.sendFile(path.join(__dirname, "static/index.html"));
});


app.get("/not-eligible", (req, res) => {
    res.sendFile(path.join(__dirname, "static/index.html"));
});

app.get("/app", (req, res) => {
    res.sendFile(path.join(__dirname, "static/index.html"));
});

// Serve index.html for any subpath under /app
app.get("/app/*", (req, res) => {
    res.sendFile(path.join(__dirname, "static/index.html"));
});

mongoose.connection.once("connected", () => {
	console.log("\nConnected to Database");
	app.listen(4001, "0.0.0.0", () => {
	})
})
