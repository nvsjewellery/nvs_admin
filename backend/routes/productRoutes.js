const express = require("express");
const {
  getProducts, createProduct, updateProduct, deleteProduct, bulkAction,
} = require("../controllers/productController");
const { protectAdmin } = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.use(protectAdmin); // every route below requires admin session

router.get("/", getProducts);
router.post("/", createProduct);
router.post("/bulk", bulkAction);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;