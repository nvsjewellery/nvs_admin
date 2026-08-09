const asyncHandler = require("express-async-handler");
const prisma = require("../lib/prisma");

const VALID_TYPES = ["SEASONAL", "COUPON", "CUSTOMER"];
const VALID_TARGETS = ["PRODUCT", "CATEGORY", "CART", "CUSTOMER"];
const VALID_KINDS = ["percent", "flat"];
const VALID_METALS = ["Gold", "Silver"];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function parseOptionalDate(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    const error = new Error(`Invalid ${fieldName}`);
    error.statusCode = 400;
    throw error;
  }

  return date;
}

function parseUsageLimit(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const limit = Number(value);

  if (!Number.isInteger(limit) || limit <= 0) {
    const error = new Error(
      "Usage limit must be a positive whole number"
    );
    error.statusCode = 400;
    throw error;
  }

  return limit;
}

function validateDiscountValue(kind, value) {
  const discountValue = Number(value);

  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    const error = new Error(
      "Discount value must be greater than 0"
    );
    error.statusCode = 400;
    throw error;
  }

  if (kind === "percent" && discountValue > 100) {
    const error = new Error(
      "Percentage discount cannot exceed 100%"
    );
    error.statusCode = 400;
    throw error;
  }

  return discountValue;
}

function validateDateRange(startDate, endDate) {
  if (startDate && endDate && endDate < startDate) {
    const error = new Error(
      "End date cannot be before start date"
    );
    error.statusCode = 400;
    throw error;
  }
}

function validateTypeTarget(type, target) {
  if (!VALID_TYPES.includes(type)) {
    const error = new Error(
      "Invalid discount type"
    );
    error.statusCode = 400;
    throw error;
  }

  if (!VALID_TARGETS.includes(target)) {
    const error = new Error(
      "Invalid discount target"
    );
    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Seasonal
  |--------------------------------------------------------------------------
  */

  if (
    type === "SEASONAL" &&
    !["PRODUCT", "CATEGORY"].includes(target)
  ) {
    const error = new Error(
      "Seasonal discounts must target products or categories"
    );
    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Coupon
  |--------------------------------------------------------------------------
  */

  if (type === "COUPON" && target !== "CART") {
    const error = new Error(
      "Coupon discounts must target the cart"
    );
    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Customer-specific
  |--------------------------------------------------------------------------
  */

  if (type === "CUSTOMER" && target !== "CUSTOMER") {
    const error = new Error(
      "Customer discounts must target a specific customer"
    );
    error.statusCode = 400;
    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| GET ALL DISCOUNTS
|--------------------------------------------------------------------------
|
| Admin can see:
| - Seasonal discounts
| - Coupon discounts
| - Customer-specific discounts
|
*/

const getDiscounts = asyncHandler(async (req, res) => {
  const discounts = await prisma.discount.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      products: {
        select: {
          id: true,
          name: true,
          sku: true,
          metal: true,
          category: true,
          va: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  res.status(200).json({
    success: true,
    discounts,
  });
});

/*
|--------------------------------------------------------------------------
| CREATE DISCOUNT
|--------------------------------------------------------------------------
|
| Supported:
|
| SEASONAL
|   PRODUCT
|   CATEGORY
|
| COUPON
|   CART
|
| CUSTOMER
|   CUSTOMER
|
| IMPORTANT:
| Every discount is applied ONLY to VA.
|
*/

const createDiscount = asyncHandler(async (req, res) => {
  const {
    name,
    type,
    target,
    kind,
    value,
    code,
    userId,
    metal,
    category,
    productIds,
    startDate,
    endDate,
    usageLimit,
    isActive,
  } = req.body;

  /*
  |--------------------------------------------------------------------------
  | Required fields
  |--------------------------------------------------------------------------
  */

  if (!type) {
    res.status(400);
    throw new Error("Discount type is required");
  }

  if (!target) {
    res.status(400);
    throw new Error("Discount target is required");
  }

  if (!kind) {
    res.status(400);
    throw new Error("Discount kind is required");
  }

  if (!VALID_KINDS.includes(kind)) {
    res.status(400);
    throw new Error("Invalid discount kind");
  }

  /*
  |--------------------------------------------------------------------------
  | Type + Target validation
  |--------------------------------------------------------------------------
  */

  validateTypeTarget(type, target);

  /*
  |--------------------------------------------------------------------------
  | Metal validation
  |--------------------------------------------------------------------------
  */

  if (metal && !VALID_METALS.includes(metal)) {
    res.status(400);
    throw new Error("Invalid metal");
  }

  /*
  |--------------------------------------------------------------------------
  | Discount value
  |--------------------------------------------------------------------------
  */

  const discountValue = validateDiscountValue(
    kind,
    value
  );

  /*
  |--------------------------------------------------------------------------
  | Normalize product IDs
  |--------------------------------------------------------------------------
  */

  let selectedProductIds = [];

  if (Array.isArray(productIds)) {
    selectedProductIds = [
      ...new Set(
        productIds
          .filter(Boolean)
          .map((id) => String(id))
      ),
    ];
  }

  /*
  |--------------------------------------------------------------------------
  | PRODUCT target
  |--------------------------------------------------------------------------
  */

  if (
    target === "PRODUCT" &&
    selectedProductIds.length === 0
  ) {
    res.status(400);
    throw new Error(
      "Select at least one product"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CATEGORY target
  |--------------------------------------------------------------------------
  */

  if (
    target === "CATEGORY" &&
    !category
  ) {
    res.status(400);
    throw new Error(
      "Category is required"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Coupon
  |--------------------------------------------------------------------------
  */

  let normalizedCode = null;

  if (type === "COUPON") {
    if (!code || !String(code).trim()) {
      res.status(400);
      throw new Error(
        "Coupon code is required"
      );
    }

    normalizedCode = String(code)
      .trim()
      .toUpperCase();

    const existingCoupon =
      await prisma.discount.findUnique({
        where: {
          code: normalizedCode,
        },
      });

    if (existingCoupon) {
      res.status(400);
      throw new Error(
        "Coupon code already exists"
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Customer-specific discount
  |--------------------------------------------------------------------------
  */

  if (type === "CUSTOMER") {
    if (!userId) {
      res.status(400);
      throw new Error(
        "Customer must be selected"
      );
    }

    const customer =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          id: true,
        },
      });

    if (!customer) {
      res.status(404);
      throw new Error(
        "Customer not found"
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Dates
  |--------------------------------------------------------------------------
  */

  const parsedStartDate =
    parseOptionalDate(
      startDate,
      "start date"
    );

  const parsedEndDate =
    parseOptionalDate(
      endDate,
      "end date"
    );

  validateDateRange(
    parsedStartDate,
    parsedEndDate
  );

  /*
  |--------------------------------------------------------------------------
  | Usage limit
  |--------------------------------------------------------------------------
  */

  const parsedUsageLimit =
    parseUsageLimit(
      usageLimit
    );

  /*
  |--------------------------------------------------------------------------
  | Validate selected products
  |--------------------------------------------------------------------------
  */

  if (selectedProductIds.length > 0) {
    const products =
      await prisma.product.findMany({
        where: {
          id: {
            in: selectedProductIds,
          },
        },

        select: {
          id: true,
          metal: true,
        },
      });

    if (
      products.length !==
      selectedProductIds.length
    ) {
      res.status(400);
      throw new Error(
        "One or more selected products do not exist"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Metal consistency
    |--------------------------------------------------------------------------
    */

    if (metal) {
      const invalidProduct =
        products.find(
          (product) =>
            product.metal !== metal
        );

      if (invalidProduct) {
        res.status(400);
        throw new Error(
          "Selected products must belong to the selected metal"
        );
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Create discount
  |--------------------------------------------------------------------------
  */

  const discount =
    await prisma.discount.create({
      data: {
        name: name
          ? String(name).trim()
          : null,

        type,
        target,
        kind,

        value: discountValue,

        code: normalizedCode,

        userId:
          type === "CUSTOMER"
            ? userId
            : null,

        metal:
          metal || null,

        category:
          target === "CATEGORY" &&
          category
            ? String(category).trim()
            : null,

        startDate:
          parsedStartDate,

        endDate:
          parsedEndDate,

        usageLimit:
          parsedUsageLimit,

        usageCount: 0,

        isActive:
          typeof isActive === "boolean"
            ? isActive
            : true,

        products:
          selectedProductIds.length > 0
            ? {
                connect:
                  selectedProductIds.map(
                    (id) => ({
                      id,
                    })
                  ),
              }
            : undefined,
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        products: {
          select: {
            id: true,
            name: true,
            sku: true,
            metal: true,
            category: true,
            va: true,
          },
        },
      },
    });

  res.status(201).json({
    success: true,
    discount,
  });
});

/*
|--------------------------------------------------------------------------
| UPDATE DISCOUNT
|--------------------------------------------------------------------------
|
| Can update:
| - name
| - value
| - dates
| - usage limit
| - active state
|
*/

const updateDiscount =
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing =
      await prisma.discount.findUnique({
        where: {
          id,
        },
      });

    if (!existing) {
      res.status(404);
      throw new Error(
        "Discount not found"
      );
    }

    const {
      name,
      value,
      startDate,
      endDate,
      usageLimit,
      isActive,
    } = req.body;

    const data = {};

    /*
    |--------------------------------------------------------------------------
    | Name
    |--------------------------------------------------------------------------
    */

    if (name !== undefined) {
      data.name =
        name && String(name).trim()
          ? String(name).trim()
          : null;
    }

    /*
    |--------------------------------------------------------------------------
    | Value
    |--------------------------------------------------------------------------
    */

    if (value !== undefined) {
      data.value =
        validateDiscountValue(
          existing.kind,
          value
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Dates
    |--------------------------------------------------------------------------
    */

    let nextStartDate =
      existing.startDate;

    let nextEndDate =
      existing.endDate;

    if (startDate !== undefined) {
      nextStartDate =
        parseOptionalDate(
          startDate,
          "start date"
        );

      data.startDate =
        nextStartDate;
    }

    if (endDate !== undefined) {
      nextEndDate =
        parseOptionalDate(
          endDate,
          "end date"
        );

      data.endDate =
        nextEndDate;
    }

    validateDateRange(
      nextStartDate,
      nextEndDate
    );

    /*
    |--------------------------------------------------------------------------
    | Usage limit
    |--------------------------------------------------------------------------
    */

    if (usageLimit !== undefined) {
      data.usageLimit =
        parseUsageLimit(
          usageLimit
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Active state
    |--------------------------------------------------------------------------
    */

    if (isActive !== undefined) {
      data.isActive =
        Boolean(isActive);
    }

    /*
    |--------------------------------------------------------------------------
    | Save
    |--------------------------------------------------------------------------
    */

    const discount =
      await prisma.discount.update({
        where: {
          id,
        },

        data,

        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          products: {
            select: {
              id: true,
              name: true,
              sku: true,
              metal: true,
              category: true,
              va: true,
            },
          },
        },
      });

    res.status(200).json({
      success: true,
      discount,
    });
  });

/*
|--------------------------------------------------------------------------
| DELETE DISCOUNT
|--------------------------------------------------------------------------
*/

const deleteDiscount =
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing =
      await prisma.discount.findUnique({
        where: {
          id,
        },
      });

    if (!existing) {
      res.status(404);
      throw new Error(
        "Discount not found"
      );
    }

    await prisma.discount.delete({
      where: {
        id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Discount removed",
    });
  });

module.exports = {
  getDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
};