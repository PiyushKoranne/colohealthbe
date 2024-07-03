const mongoose = require('mongoose');
const MONGODB_URL = process.env.MONGODB_URL;
// const {Spinner} = require("@topcli/spinner");

async function sleep(ms) {
	return new Promise((resolve, reject) => {
		setTimeout(()=>{
			resolve();
		}, ms)
	})
}
async function Connectdb() {
	try {
		// const spinnerTop = new Spinner().start("Connecting to Database");
		// spinnerTop.text = "Connection in progress";
		// await sleep(3000);
		await mongoose.connect(MONGODB_URL);
		// spinnerTop.succeed("Connected to Database");
	} catch (error) {
		console.log("Failed to connect to the database\n ------ERROR------\n", error)
	}

}

module.exports = { Connectdb };
