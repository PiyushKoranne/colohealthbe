const multer = require("multer");
const path = require("path");


console.log(__dirname)
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.join(__dirname, "../public/uploads/profiles"));
	},
	filename: (req, file, cb) => {
		cb(null, file.originalname);
	}
})

const upload = multer({
	storage: storage
});

module.exports = upload;