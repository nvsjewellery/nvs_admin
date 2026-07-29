const asyncHandler = require("express-async-handler");
const prisma = require("../lib/prisma");

// @desc Get all products
// @route GET /api/admin/products
const getProducts = asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.status(200).json({ success: true, products });
});

// @desc Create a product
// @route POST /api/admin/products
const createProduct = asyncHandler(async (req, res) => {
  const data = req.body;

  const product = await prisma.product.create({
    data: {
      name: data.name,
      description: data.description ?? "",
      metal: data.metal,
      category: data.category,
      purity: data.purity,
      grossWeight: data.grossWeight != null ? Number(data.grossWeight) : null,
      stoneWeight: data.stoneWeight != null ? Number(data.stoneWeight) : null,
      stoneCost: data.stoneCost != null ? Number(data.stoneCost) : null,
      hallmarkId: data.hallmarkId ?? null,
      sku: data.sku,
      va: data.va != null ? Number(data.va) : null,
      gstRate: data.gstRate != null ? Number(data.gstRate) : 3,
      isDirectSterling: !!data.isDirectSterling,
      pieceCost: data.pieceCost != null ? Number(data.pieceCost) : null,
      image: data.image ?? "",
      status: data.status ?? "Draft",
      stock: data.stock != null ? Number(data.stock) : 0,
    },
  });

  res.status(201).json({ success: true, product });
});

// @desc Update a product
// @route PUT /api/admin/products/:id
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    res.status(404);
    throw new Error("Product not found");
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: data.name ?? existing.name,
      description: data.description ?? existing.description,
      metal: data.metal ?? existing.metal,
      category: data.category ?? existing.category,
      purity: data.purity ?? existing.purity,
      grossWeight: data.grossWeight != null ? Number(data.grossWeight) : existing.grossWeight,
      stoneWeight: data.stoneWeight != null ? Number(data.stoneWeight) : existing.stoneWeight,
      stoneCost: data.stoneCost != null ? Number(data.stoneCost) : existing.stoneCost,
      hallmarkId: data.hallmarkId ?? existing.hallmarkId,
      sku: data.sku ?? existing.sku,
      va: data.va != null ? Number(data.va) : existing.va,
      gstRate: data.gstRate != null ? Number(data.gstRate) : existing.gstRate,
      isDirectSterling: data.isDirectSterling !== undefined ? !!data.isDirectSterling : existing.isDirectSterling,
      pieceCost: data.pieceCost != null ? Number(data.pieceCost) : existing.pieceCost,
      image: data.image ?? existing.image,
      status: data.status ?? existing.status,
      stock: data.stock != null ? Number(data.stock) : existing.stock,
    },
  });

  res.status(200).json({ success: true, product });
});

// @desc Delete a product
// @route DELETE /api/admin/products/:id
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    res.status(404);
    throw new Error("Product not found");
  }

  await prisma.product.delete({ where: { id } });

  res.status(200).json({ success: true, message: "Product deleted" });
});

// @desc Bulk update status or delete
// @route POST /api/admin/products/bulk
const bulkAction = asyncHandler(async (req, res) => {
  const { ids, action } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error("No product ids provided");
  }

  if (action === "delete") {
    await prisma.product.deleteMany({ where: { id: { in: ids } } });
  } else if (action === "activate") {
    await prisma.product.updateMany({ where: { id: { in: ids } }, data: { status: "Active" } });
  } else if (action === "deactivate") {
    await prisma.product.updateMany({ where: { id: { in: ids } }, data: { status: "Inactive" } });
  } else {
    res.status(400);
    throw new Error("Invalid bulk action");
  }

  res.status(200).json({ success: true });
});

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkAction,
};