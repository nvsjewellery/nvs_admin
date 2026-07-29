const asyncHandler = require("express-async-handler");
const prisma = require("../lib/prisma");

const getDiscounts = asyncHandler(async (req, res) => {
  const discounts = await prisma.discount.findMany({ orderBy: { createdAt: "desc" } });
  res.status(200).json({ success: true, discounts });
});

const createDiscount = asyncHandler(async (req, res) => {
  const { metal, category, productIds, scope, kind, value } = req.body;

  if (!Array.isArray(productIds) || productIds.length === 0) {
    res.status(400);
    throw new Error("Select at least one product");
  }

  const discount = await prisma.discount.create({
    data: { metal, category, productIds, scope, kind, value: Number(value) },
  });

  res.status(201).json({ success: true, discount });
});

const deleteDiscount = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.discount.findUnique({ where: { id } });
  if (!existing) {
    res.status(404);
    throw new Error("Discount not found");
  }

  await prisma.discount.delete({ where: { id } });

  res.status(200).json({ success: true, message: "Discount removed" });
});

module.exports = { getDiscounts, createDiscount, deleteDiscount };