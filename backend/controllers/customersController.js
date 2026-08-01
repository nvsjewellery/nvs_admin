const asyncHandler = require("express-async-handler");
const prisma = require("../lib/prisma");

const getCustomers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    include: {
      addresses: true,
      wishlist: true,
      cart: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const customers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    joined: u.createdAt,
    addresses: u.addresses.length,
    wishlist: u.wishlist.length,
    cart: u.cart.length,
  }));

  res.json({
    success: true,
    customers,
  });
});

module.exports = {
  getCustomers,
};