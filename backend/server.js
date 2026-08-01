require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const prisma = require("./lib/prisma");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const adminAuthRoutes = require("./routes/adminAuthRoutes");
const productRoutes = require("./routes/productRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const discountRoutes = require("./routes/discountRoutes");
const reelRoutes = require("./routes/reelRoutes");


const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.ADMIN_CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/products", productRoutes);
app.use("/api/admin/upload", uploadRoutes);
app.use("/api/admin/categories", categoryRoutes);
app.use("/api/admin/discounts", discountRoutes);
app.use("/api/reels", reelRoutes);
app.use("/api/admin/customers", require("./routes/customerRoutes"));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const start = async () => {
  try {
    await prisma.$connect();
    console.log("✅ PostgreSQL connected via Prisma (shared DB)");
    app.listen(PORT, () => console.log(`🚀 Admin backend running on port ${PORT}`));
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  }
};

start();