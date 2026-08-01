const express = require("express");
const router = express.Router();

const { protectAdmin } = require("../middleware/adminAuthMiddleware");
const { getCustomers } = require("../controllers/customersController");

router.get("/", protectAdmin, getCustomers);

module.exports = router;