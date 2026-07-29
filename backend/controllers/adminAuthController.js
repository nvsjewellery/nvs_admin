const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const generateAdminToken = require("../utils/generateAdminToken");

const loginAdmin = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const isEmailMatch = normalizedEmail === process.env.ADMIN_EMAIL.toLowerCase();
  const isPasswordMatch = isEmailMatch
    ? await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH)
    : false;

  if (!isEmailMatch || !isPasswordMatch) {
    res.status(401);
    throw new Error("Invalid admin credentials");
  }

  generateAdminToken(res);

  res.status(200).json({
    success: true,
    admin: { email: process.env.ADMIN_EMAIL, role: "admin" },
  });
});

const logoutAdmin = asyncHandler(async (req, res) => {
  res.cookie("admin_token", "", { httpOnly: true, expires: new Date(0), path: "/" });
  res.status(200).json({ success: true, message: "Logged out" });
});

const getAdminMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    admin: { email: process.env.ADMIN_EMAIL, role: "admin" },
  });
});

module.exports = { loginAdmin, logoutAdmin, getAdminMe };