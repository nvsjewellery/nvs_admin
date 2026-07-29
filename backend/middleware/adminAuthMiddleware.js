const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

const protectAdmin = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.admin_token;

  if (!token) {
    res.status(401);
    throw new Error("Not authorized as admin");
  }

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    if (decoded.role !== "admin") {
      res.status(403);
      throw new Error("Forbidden");
    }
    req.isAdmin = true;
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Admin session invalid or expired");
  }
});

module.exports = { protectAdmin };