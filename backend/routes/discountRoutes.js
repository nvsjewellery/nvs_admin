const express = require("express");
const { getDiscounts, createDiscount, deleteDiscount } = require("../controllers/discountController");
const { protectAdmin } = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.use(protectAdmin);

router.get("/", getDiscounts);
router.post("/", createDiscount);
router.delete("/:id", deleteDiscount);

module.exports = router;