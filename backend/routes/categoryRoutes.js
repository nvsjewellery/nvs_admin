const express = require("express");
const {
  getCategories, createCategory, updateCategory, deleteCategory, reorderCategories,
} = require("../controllers/categoryController");
const { protectAdmin } = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.use(protectAdmin);

router.get("/", getCategories);
router.post("/", createCategory);
router.post("/reorder", reorderCategories);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;