const express = require("express");

const {
  getDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} = require("../controllers/discountController");

const {
  protectAdmin,
} = require("../middleware/adminAuthMiddleware");

const router = express.Router();

// All discount routes are admin-only
router.use(protectAdmin);

// Get all discounts
router.get("/", getDiscounts);

// Create discount
router.post("/", createDiscount);

// Update discount
router.patch("/:id", updateDiscount);

// Delete discount
router.delete("/:id", deleteDiscount);

module.exports = router;