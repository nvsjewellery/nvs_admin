const asyncHandler = require("express-async-handler");

const {
  processAndUploadImage,
  uploadVideo,
} = require("../middleware/uploadMiddleware");

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  let url;

  if (req.file.mimetype.startsWith("image/")) {
    url = await processAndUploadImage(
      req.file.buffer,
      req.file.originalname
    );
  } else if (req.file.mimetype.startsWith("video/")) {
    url = await uploadVideo(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
  } else {
    res.status(400);
    throw new Error("Unsupported file type");
  }

  res.json({
    success: true,
    url,
  });
});

module.exports = {
  uploadImage,
};