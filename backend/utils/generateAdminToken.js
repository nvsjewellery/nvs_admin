const jwt = require("jsonwebtoken");

const generateAdminToken = (res) => {
  const token = jwt.sign({ role: "admin" }, process.env.ADMIN_JWT_SECRET, {
    expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || "1d",
  });

  res.cookie("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
  });

  return token;
};

module.exports = generateAdminToken;