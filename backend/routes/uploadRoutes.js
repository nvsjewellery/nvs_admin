const express = require("express");
const { upload } = require("../middleware/uploadMiddleware");
const { uploadImage } = require("../controllers/uploadController");
const { protectAdmin } = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.post("/", protectAdmin, upload.single("image"), uploadImage);

module.exports = router;