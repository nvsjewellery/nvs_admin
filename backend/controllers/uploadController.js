const asyncHandler = require("express-async-handler");
const { processAndUploadImage } = require("../middleware/uploadMiddleware");

// @desc Upload a product image
// @route POST /api/admin/upload
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No image file provided");
  }

  const url = await processAndUploadImage(req.file.buffer, req.file.originalname);

  res.status(200).json({ success: true, url });
});

module.exports = { uploadImage };