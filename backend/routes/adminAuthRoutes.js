const express = require("express");
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");
const { loginAdmin, logoutAdmin, getAdminMe } = require("../controllers/adminAuthController");
const { protectAdmin } = require("../middleware/adminAuthMiddleware");

const router = express.Router();

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many attempts, try again later" },
});

router.post(
  "/login",
  adminLoginLimiter,
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  loginAdmin
);

router.post("/logout", logoutAdmin);
router.get("/me", protectAdmin, getAdminMe);

module.exports = router;