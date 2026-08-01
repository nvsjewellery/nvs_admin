const multer = require("multer");
const sharp = require("sharp");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { spacesClient } = require("../config/spaces");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      return cb(null, true);
    }

    cb(new Error("Only images and videos are allowed"));
  },
});

const processAndUploadImage = async (buffer, originalName) => {
  const processedBuffer = await sharp(buffer)
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

const uploadVideo = async (buffer, originalName, mimetype) => {
  const ext = originalName.split(".").pop();

  const key = `reels/${Date.now()}.${ext}`;

  await spacesClient.send(
    new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      ACL: "public-read",
    })
  );

  return `${process.env.DO_SPACES_ENDPOINT}/${process.env.DO_SPACES_BUCKET}/${key}`;
};

module.exports = {
  upload,
  processAndUploadImage,
  uploadVideo,
};