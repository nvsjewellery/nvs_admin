const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const prisma = require("../lib/prisma");

const VALID_TYPES = ["SEASONAL", "COUPON", "CUSTOMER"];
const VALID_TARGETS = [
  "PRODUCT",
  "CATEGORY",
  "CART",
  "CUSTOMER",
];
const VALID_KINDS = ["percent", "flat"];
const VALID_METALS = ["Gold", "Silver"];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Create a normal application error
|--------------------------------------------------------------------------
*/

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/*
|--------------------------------------------------------------------------
| Parse optional date
|--------------------------------------------------------------------------
*/

function parseOptionalDate(value, fieldName) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw createError(`Invalid ${fieldName}`);
  }

  return date;
}

/*
|--------------------------------------------------------------------------
| Parse usage limit
|--------------------------------------------------------------------------
*/

function parseUsageLimit(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const limit = Number(value);

  if (
    !Number.isInteger(limit) ||
    limit <= 0
  ) {
    throw createError(
      "Usage limit must be a positive whole number"
    );
  }

  return limit;
}

/*
|--------------------------------------------------------------------------
| Validate discount value
|--------------------------------------------------------------------------
*/

function validateDiscountValue(kind, value) {
  const discountValue = Number(value);

  if (
    !Number.isFinite(discountValue) ||
    discountValue <= 0
  ) {
    throw createError(
      "Discount value must be greater than 0"
    );
  }

  if (
    kind === "percent" &&
    discountValue > 100
  ) {
    throw createError(
      "Percentage discount cannot exceed 100%"
    );
  }

  return discountValue;
}

/*
|--------------------------------------------------------------------------
| Validate date range
|--------------------------------------------------------------------------
*/

function validateDateRange(
  startDate,
  endDate
) {
  if (
    startDate &&
    endDate &&
    endDate < startDate
  ) {
    throw createError(
      "End date cannot be before start date"
    );
  }
}

/*
|--------------------------------------------------------------------------
| Validate type + target
|--------------------------------------------------------------------------
*/

function validateTypeTarget(
  type,
  target
) {
  if (!VALID_TYPES.includes(type)) {
    throw createError(
      "Invalid discount type"
    );
  }

  if (!VALID_TARGETS.includes(target)) {
    throw createError(
      "Invalid discount target"
    );
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
    throw createError(
      "Seasonal discounts must target products or categories"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Coupon
  |--------------------------------------------------------------------------
  */

  if (
    type === "COUPON" &&
    target !== "CART"
  ) {
    throw createError(
      "Coupon discounts must target the cart"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Customer-specific
  |--------------------------------------------------------------------------
  */

  if (
    type === "CUSTOMER" &&
    target !== "CUSTOMER"
  ) {
    throw createError(
      "Customer discounts must target a specific customer"
    );
  }
}

/*
|--------------------------------------------------------------------------
| Generate random coupon code
|--------------------------------------------------------------------------
|
| Example:
|
| NVS7K4P2
| NVSX91LM
| NVS5Q8RT
|
| We intentionally avoid characters such as:
|
| I
| O
| 0
| 1
|
| because they can be confusing when a customer
| reads or types the coupon manually.
|
*/

function generateCouponCode() {
  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  const randomBytes =
    crypto.randomBytes(6);

  let randomPart = "";

  for (let i = 0; i < 6; i++) {
    randomPart +=
      characters[
        randomBytes[i] %
          characters.length
      ];
  }

  return `NVS${randomPart}`;
}

/*
|--------------------------------------------------------------------------
| Generate a coupon code that does not currently exist
|--------------------------------------------------------------------------
*/

async function generateUniqueCouponCode() {
  const MAX_ATTEMPTS = 20;

  for (
    let attempt = 0;
    attempt < MAX_ATTEMPTS;
    attempt++
  ) {
    const code =
      generateCouponCode();

    const existing =
      await prisma.discount.findUnique({
        where: {
          code,
        },
        select: {
          id: true,
        },
      });

    if (!existing) {
      return code;
    }
  }

  throw createError(
    "Unable to generate a unique coupon code. Please try again.",
    500
  );
}

/*
|--------------------------------------------------------------------------
| Check whether Prisma error is a coupon-code unique collision
|--------------------------------------------------------------------------
*/

function isCouponCodeUniqueError(
  error
) {
  return (
    error &&
    error.code === "P2002" &&
    (
      error.meta?.target === "code" ||
      (
        Array.isArray(
          error.meta?.target
        ) &&
        error.meta.target.includes(
          "code"
        )
      )
    )
  );
}

/*
|--------------------------------------------------------------------------
| Common discount include
|--------------------------------------------------------------------------
*/

const discountInclude = {
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
};

/*
|--------------------------------------------------------------------------
| GET ALL DISCOUNTS
|--------------------------------------------------------------------------
|
| Admin can see:
|
| - Seasonal discounts
| - Coupon discounts
| - Customer-specific discounts
|
*/

const getDiscounts =
  asyncHandler(
    async (req, res) => {
      const discounts =
        await prisma.discount.findMany({
          include:
            discountInclude,

          orderBy: {
            createdAt: "desc",
          },
        });

      res.status(200).json({
        success: true,
        discounts,
      });
    }
  );

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
|
| Every discount is applied ONLY to VA.
|
| Coupon codes are generated automatically by
| the backend. The frontend does NOT need to
| provide a coupon code.
|
*/

const createDiscount =
  asyncHandler(
    async (req, res) => {
      const {
        name,
        type,
        target,
        kind,
        value,
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
        throw createError(
          "Discount type is required"
        );
      }

      if (!target) {
        throw createError(
          "Discount target is required"
        );
      }

      if (!kind) {
        throw createError(
          "Discount kind is required"
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Validate kind
      |--------------------------------------------------------------------------
      */

      if (!VALID_KINDS.includes(kind)) {
        throw createError(
          "Invalid discount kind"
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Validate type + target
      |--------------------------------------------------------------------------
      */

      validateTypeTarget(
        type,
        target
      );

      /*
      |--------------------------------------------------------------------------
      | Validate metal
      |--------------------------------------------------------------------------
      */

      if (
        metal &&
        !VALID_METALS.includes(metal)
      ) {
        throw createError(
          "Invalid metal"
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Validate discount value
      |--------------------------------------------------------------------------
      */

      const discountValue =
        validateDiscountValue(
          kind,
          value
        );

      /*
      |--------------------------------------------------------------------------
      | Normalize product IDs
      |--------------------------------------------------------------------------
      */

      let selectedProductIds = [];

      if (
        Array.isArray(productIds)
      ) {
        selectedProductIds = [
          ...new Set(
            productIds
              .filter(Boolean)
              .map((id) =>
                String(id)
              )
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
        throw createError(
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
        (!category ||
          !String(category).trim())
      ) {
        throw createError(
          "Category is required"
        );
      }

      /*
      |--------------------------------------------------------------------------
      | CUSTOMER discount
      |--------------------------------------------------------------------------
      */

      if (
        type === "CUSTOMER"
      ) {
        if (!userId) {
          throw createError(
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
          throw createError(
            "Customer not found",
            404
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

      if (
        selectedProductIds.length > 0
      ) {
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

        /*
        |--------------------------------------------------------------------------
        | Make sure all products exist
        |--------------------------------------------------------------------------
        */

        if (
          products.length !==
          selectedProductIds.length
        ) {
          throw createError(
            "One or more selected products do not exist"
          );
        }

        /*
        |--------------------------------------------------------------------------
        | Make sure products belong to selected metal
        |--------------------------------------------------------------------------
        */

        if (metal) {
          const invalidProduct =
            products.find(
              (product) =>
                product.metal !==
                metal
            );

          if (invalidProduct) {
            throw createError(
              "Selected products must belong to the selected metal"
            );
          }
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Prepare normalized values
      |--------------------------------------------------------------------------
      */

      const normalizedName =
        name &&
        String(name).trim()
          ? String(name).trim()
          : null;

      const normalizedCategory =
        target === "CATEGORY" &&
        category &&
        String(category).trim()
          ? String(category).trim()
          : null;

      /*
      |--------------------------------------------------------------------------
      | Prepare common database data
      |--------------------------------------------------------------------------
      */

      const baseData = {
        name: normalizedName,

        type,

        target,

        kind,

        value:
          discountValue,

        /*
        |--------------------------------------------------------------------------
        | Coupon code is added below.
        |--------------------------------------------------------------------------
        */

        code: null,

        userId:
          type === "CUSTOMER"
            ? userId
            : null,

        metal:
          metal || null,

        category:
          normalizedCategory,

        startDate:
          parsedStartDate,

        endDate:
          parsedEndDate,

        usageLimit:
          parsedUsageLimit,

        usageCount: 0,

        isActive:
          typeof isActive ===
          "boolean"
            ? isActive
            : true,

        products:
          selectedProductIds.length >
          0
            ? {
                connect:
                  selectedProductIds.map(
                    (id) => ({
                      id,
                    })
                  ),
              }
            : undefined,
      };

      /*
      |--------------------------------------------------------------------------
      | CREATE NON-COUPON DISCOUNT
      |--------------------------------------------------------------------------
      |
      | Seasonal and customer-specific discounts
      | don't need any special retry logic.
      |
      */

      if (type !== "COUPON") {
        const discount =
          await prisma.discount.create({
            data: baseData,

            include:
              discountInclude,
          });

        res.status(201).json({
          success: true,
          discount,
        });

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | CREATE COUPON DISCOUNT
      |--------------------------------------------------------------------------
      |
      | Coupon code generation happens completely
      | on the backend.
      |
      | Flow:
      |
      | Generate code
      |      ↓
      | Check DB
      |      ↓
      | Create
      |      ↓
      | Collision?
      |      ↓
      | Generate another
      |
      */

      const MAX_CREATE_ATTEMPTS =
        20;

      for (
        let attempt = 0;
        attempt < MAX_CREATE_ATTEMPTS;
        attempt++
      ) {
        const generatedCode =
          await generateUniqueCouponCode();

        try {
          const discount =
            await prisma.discount.create({
              data: {
                ...baseData,

                code:
                  generatedCode,
              },

              include:
                discountInclude,
            });

          /*
          |--------------------------------------------------------------------------
          | Successfully created coupon
          |--------------------------------------------------------------------------
          */

          res.status(201).json({
            success: true,
            discount,
          });

          return;
        } catch (error) {
          /*
          |--------------------------------------------------------------------------
          | Extremely unlikely race-condition:
          |
          | Another request may have created the
          | exact same code between our findUnique()
          | and create().
          |
          | If that happens, simply generate another
          | code and retry.
          |--------------------------------------------------------------------------
          */

          if (
            isCouponCodeUniqueError(
              error
            )
          ) {
            continue;
          }

          throw error;
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Failed after multiple attempts
      |--------------------------------------------------------------------------
      */

      throw createError(
        "Unable to generate a unique coupon code. Please try again.",
        500
      );
    }
  );

/*
|--------------------------------------------------------------------------
| UPDATE DISCOUNT
|--------------------------------------------------------------------------
|
| Can update:
|
| - name
| - value
| - dates
| - usage limit
| - active state
|
| Coupon code is intentionally NOT editable.
|
| The generated coupon code should remain stable
| after creation.
|
*/

const updateDiscount =
  asyncHandler(
    async (req, res) => {
      const { id } =
        req.params;

      const existing =
        await prisma.discount.findUnique({
          where: {
            id,
          },
        });

      if (!existing) {
        throw createError(
          "Discount not found",
          404
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

      if (
        name !== undefined
      ) {
        data.name =
          name &&
          String(name).trim()
            ? String(name).trim()
            : null;
      }

      /*
      |--------------------------------------------------------------------------
      | Value
      |--------------------------------------------------------------------------
      */

      if (
        value !== undefined
      ) {
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

      if (
        startDate !==
        undefined
      ) {
        nextStartDate =
          parseOptionalDate(
            startDate,
            "start date"
          );

        data.startDate =
          nextStartDate;
      }

      if (
        endDate !==
        undefined
      ) {
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

      if (
        usageLimit !==
        undefined
      ) {
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

      if (
        isActive !==
        undefined
      ) {
        data.isActive =
          Boolean(isActive);
      }

      /*
      |--------------------------------------------------------------------------
      | Update
      |--------------------------------------------------------------------------
      */

      const discount =
        await prisma.discount.update({
          where: {
            id,
          },

          data,

          include:
            discountInclude,
        });

      res.status(200).json({
        success: true,
        discount,
      });
    }
  );

/*
|--------------------------------------------------------------------------
| DELETE DISCOUNT
|--------------------------------------------------------------------------
*/

const deleteDiscount =
  asyncHandler(
    async (req, res) => {
      const { id } =
        req.params;

      const existing =
        await prisma.discount.findUnique({
          where: {
            id,
          },
        });

      if (!existing) {
        throw createError(
          "Discount not found",
          404
        );
      }

      await prisma.discount.delete({
        where: {
          id,
        },
      });

      res.status(200).json({
        success: true,
        message:
          "Discount removed",
      });
    }
  );

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  getDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
};