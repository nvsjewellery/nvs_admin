const asyncHandler = require("express-async-handler");
const prisma = require("../lib/prisma");

const getCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({ orderBy: [{ metal: "asc" }, { sortOrder: "asc" }] });
  res.status(200).json({ success: true, categories });
});

const createCategory = asyncHandler(async (req, res) => {
  const { metal, name, slug, metaTitle, metaDesc, image } = req.body;

  const maxOrder = await prisma.category.findFirst({
    where: { metal },
    orderBy: { sortOrder: "desc" },
  });

  const category = await prisma.category.create({
    data: {
      metal,
      name,
      slug,
      metaTitle: metaTitle ?? "",
      metaDesc: metaDesc ?? "",
      image: image ?? "",
      sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
    },
  });

  res.status(201).json({ success: true, category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, slug, metaTitle, metaDesc, image } = req.body;

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    res.status(404);
    throw new Error("Category not found");
  }

  const category = await prisma.category.update({
    where: { id },
    data: { name, slug, metaTitle, metaDesc, image },
  });

  res.status(200).json({ success: true, category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    res.status(404);
    throw new Error("Category not found");
  }

  await prisma.category.delete({ where: { id } });

  res.status(200).json({ success: true, message: "Category deleted" });
});

// @desc Reorder categories within a metal group
// @route POST /api/admin/categories/reorder
const reorderCategories = asyncHandler(async (req, res) => {
  const { orderedIds } = req.body; // array of category IDs in new order

  if (!Array.isArray(orderedIds)) {
    res.status(400);
    throw new Error("orderedIds must be an array");
  }

  await Promise.all(
    orderedIds.map((id, index) =>
      prisma.category.update({ where: { id }, data: { sortOrder: index } })
    )
  );

  res.status(200).json({ success: true });
});

module.exports = { getCategories, createCategory, updateCategory, deleteCategory, reorderCategories };