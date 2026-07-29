const multer = require("multer");
const sharp = require("sharp");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { spacesClient } = require("../config/spaces");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB raw upload cap
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// Resizes to max 1200px wide, converts to WebP, compresses — typically 100-300KB output
const processAndUploadImage = async (fileBuffer, originalName) => {
  const processedBuffer = await sharp(fileBuffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const key = `products/${Date.now()}-${originalName.replace(/\.[^/.]+$/, "")}.webp`;

  await spacesClient.send(
    new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: key,
      Body: processedBuffer,
      ContentType: "image/webp",
      ACL: "public-read",
    })
  );

  return `${process.env.DO_SPACES_ENDPOINT}/${process.env.DO_SPACES_BUCKET}/${key}`;
};

module.exports = { upload, processAndUploadImage };