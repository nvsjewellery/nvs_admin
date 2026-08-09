import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Trash2,
  Copy,
  Check,
} from "lucide-react";

import { PageHeader } from "@/components/admin/shared";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  useAdmin,
  type Discount,
  type DiscountKind,
  type DiscountTarget,
  type DiscountType,
} from "@/lib/admin-store";

/* =========================================================
   ROUTE
========================================================= */

export const Route =
  createFileRoute(
    "/_admin/discounts"
  )({
    head: () => ({
      meta: [
        {
          title:
            "Discounts — NVS Admin",
        },
      ],
    }),

    component:
      DiscountsPage,
  });

/* =========================================================
   PAGE
========================================================= */

function DiscountsPage() {
  const {
    products,
    discounts,
    discountsLoading,
    addDiscount,
    removeDiscount,
    categories,
  } = useAdmin();

  /* =======================================================
     FORM STATE
  ======================================================= */

  const [type, setType] =
    useState<DiscountType>(
      "SEASONAL"
    );

  const [target, setTarget] =
    useState<DiscountTarget>(
      "CATEGORY"
    );

  const [kind, setKind] =
    useState<DiscountKind>(
      "percent"
    );

  const [metal, setMetal] =
    useState<
      "Gold" | "Silver"
    >("Gold");

  const [category, setCategory] =
    useState("");

  const [productId, setProductId] =
    useState("");

  const [userId, setUserId] =
    useState("");

  const [name, setName] =
    useState("");

  const [value, setValue] =
    useState<number>(10);

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [usageLimit, setUsageLimit] =
    useState<number | "">("");

  const [applying, setApplying] =
    useState(false);

  /* =======================================================
     GENERATED COUPON
  ======================================================= */

  const [
    generatedCoupon,
    setGeneratedCoupon,
  ] = useState<Discount | null>(
    null
  );

  const [
    copiedCoupon,
    setCopiedCoupon,
  ] = useState(false);

  /* =======================================================
     CATEGORIES
  ======================================================= */

  const availableCategories =
    useMemo(() => {
      return categories.filter(
        (categoryItem) =>
          categoryItem.metal ===
          metal
      );
    }, [
      categories,
      metal,
    ]);

  /* =======================================================
     PRODUCTS
  ======================================================= */

  const availableProducts =
    useMemo(() => {
      return products.filter(
        (product) =>
          product.metal ===
          metal
      );
    }, [
      products,
      metal,
    ]);

  /* =======================================================
     TYPE CHANGE
  ======================================================= */

  function handleTypeChange(
    nextType: DiscountType
  ) {
    setType(nextType);

    setCategory("");
    setProductId("");
    setUserId("");
    setStartDate("");
    setEndDate("");
    setUsageLimit("");
    setValue(10);
    setKind("percent");

    /*
     * Clear previously generated coupon
     * when switching discount type.
     */

    setGeneratedCoupon(null);
    setCopiedCoupon(false);

    if (
      nextType === "COUPON"
    ) {
      setTarget("CART");
      return;
    }

    if (
      nextType === "CUSTOMER"
    ) {
      setTarget("CUSTOMER");
      return;
    }

    setTarget("CATEGORY");
  }

  /* =======================================================
     TARGET CHANGE
  ======================================================= */

  function handleTargetChange(
    nextTarget: DiscountTarget
  ) {
    setTarget(nextTarget);

    setCategory("");
    setProductId("");
  }

  /* =======================================================
     METAL CHANGE
  ======================================================= */

  function handleMetalChange(
    nextMetal:
      | "Gold"
      | "Silver"
  ) {
    setMetal(nextMetal);

    setCategory("");
    setProductId("");
  }

  /* =======================================================
     VALUE CHANGE
  ======================================================= */

  function handleValueChange(
    rawValue: string
  ) {
    if (rawValue === "") {
      setValue(0);
      return;
    }

    const numericValue =
      Number(rawValue);

    if (
      !Number.isFinite(
        numericValue
      )
    ) {
      return;
    }

    setValue(numericValue);
  }

  /* =======================================================
     CREATE DISCOUNT
  ======================================================= */

  async function applyDiscount() {
    /* -----------------------------------------------------
       NAME
    ----------------------------------------------------- */

    if (!name.trim()) {
      toast.error(
        "Enter a discount name"
      );
      return;
    }

    /* -----------------------------------------------------
       CUSTOMER
    ----------------------------------------------------- */

    if (
      type === "CUSTOMER" &&
      !userId.trim()
    ) {
      toast.error(
        "Enter the customer ID"
      );
      return;
    }

    /* -----------------------------------------------------
       CATEGORY
    ----------------------------------------------------- */

    if (
      type === "SEASONAL" &&
      target === "CATEGORY" &&
      !category
    ) {
      toast.error(
        "Select a category"
      );
      return;
    }

    /* -----------------------------------------------------
       PRODUCT
    ----------------------------------------------------- */

    if (
      type === "SEASONAL" &&
      target === "PRODUCT" &&
      !productId
    ) {
      toast.error(
        "Select a product"
      );
      return;
    }

    /* -----------------------------------------------------
       VALUE
    ----------------------------------------------------- */

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      toast.error(
        "Discount value must be greater than 0"
      );
      return;
    }

    if (
      kind === "percent" &&
      value > 100
    ) {
      toast.error(
        "Percentage discount cannot exceed 100%"
      );
      return;
    }

    /* -----------------------------------------------------
       DATES
    ----------------------------------------------------- */

    if (
      startDate &&
      endDate &&
      new Date(startDate) >
        new Date(endDate)
    ) {
      toast.error(
        "End date cannot be before start date"
      );
      return;
    }

    /* -----------------------------------------------------
       USAGE LIMIT
    ----------------------------------------------------- */

    if (
      usageLimit !== "" &&
      (!Number.isInteger(
        Number(usageLimit)
      ) ||
        Number(usageLimit) <= 0)
    ) {
      toast.error(
        "Usage limit must be a positive whole number"
      );
      return;
    }

    setApplying(true);

    /*
     * Remove old generated coupon
     * while creating a new one.
     */

    setGeneratedCoupon(null);
    setCopiedCoupon(false);

    try {
      /*
       * IMPORTANT:
       *
       * We deliberately DO NOT send a `code`
       * field.
       *
       * Backend generates the coupon automatically.
       */

      const createdDiscount =
        await addDiscount({
          name: name.trim(),

          type,

          target,

          kind,

          value,

          metal,

          category:
            type ===
              "SEASONAL" &&
            target ===
              "CATEGORY"
              ? category
              : null,

          productIds:
            type ===
              "SEASONAL" &&
            target ===
              "PRODUCT"
              ? [productId]
              : [],

          userId:
            type ===
              "CUSTOMER"
              ? userId.trim()
              : null,

          startDate:
            startDate || null,

          endDate:
            endDate || null,

          usageLimit:
            usageLimit === ""
              ? null
              : Number(
                  usageLimit
                ),

          isActive: true,
        });

      /*
       * If this was a coupon,
       * save the generated coupon.
       */

      if (
        type === "COUPON" &&
        createdDiscount.code
      ) {
        setGeneratedCoupon(
          createdDiscount
        );

        toast.success(
          `Coupon created: ${createdDiscount.code}`
        );
      } else {
        toast.success(
          "Discount created successfully"
        );
      }

      /* ---------------------------------------------------
         RESET FORM
      --------------------------------------------------- */

      setName("");
      setCategory("");
      setProductId("");
      setUserId("");
      setValue(10);
      setStartDate("");
      setEndDate("");
      setUsageLimit("");
      setKind("percent");

      if (
        type === "COUPON"
      ) {
        setTarget("CART");
      } else if (
        type === "CUSTOMER"
      ) {
        setTarget("CUSTOMER");
      } else {
        setTarget("CATEGORY");
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to create discount"
      );
    } finally {
      setApplying(false);
    }
  }

  /* =======================================================
     COPY COUPON
  ======================================================= */

  async function copyCouponCode() {
    if (
      !generatedCoupon?.code
    ) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        generatedCoupon.code
      );

      setCopiedCoupon(true);

      toast.success(
        "Coupon code copied"
      );

      setTimeout(() => {
        setCopiedCoupon(false);
      }, 2000);
    } catch {
      toast.error(
        "Failed to copy coupon code"
      );
    }
  }

  /* =======================================================
     DELETE
  ======================================================= */

  async function handleRemove(
  id: string
) {
  if (
    !window.confirm(
      "Are you sure you want to remove this discount? This action cannot be undone."
    )
  ) {
    return;
  }

  try {
    await removeDiscount(id);

    /*
     * If the deleted discount is
     * the displayed generated coupon,
     * remove it from the display too.
     */

    if (
      generatedCoupon?.id === id
    ) {
      setGeneratedCoupon(null);
    }

    toast.success(
      "Discount removed"
    );
  } catch (err) {
    toast.error(
      err instanceof Error
        ? err.message
        : "Failed to remove discount"
    );
  }
}

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <PageHeader
        title="Discounts"
        description="Create and manage VA-only discounts."
      />

      {/* =================================================
          GENERATED COUPON
      ================================================= */}

      {generatedCoupon?.code && (
        <Card className="mb-6 border-gold">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

              <div>
                <p className="font-medium">
                  Coupon created successfully
                </p>

                <p className="text-xs text-muted-foreground mt-1">
                  This coupon is now active
                  and ready to use.
                </p>
              </div>

              <div className="flex items-center gap-2">

                <div className="rounded-md border bg-muted/50 px-4 py-2 font-mono font-semibold tracking-wider">
                  {
                    generatedCoupon.code
                  }
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={
                    copyCouponCode
                  }
                >
                  {copiedCoupon ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>

              </div>

            </div>
          </CardContent>
        </Card>
      )}

      {/* =================================================
          CREATE DISCOUNT
      ================================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        {/* =================================================
            CARD 1
        ================================================= */}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              1. Discount Type
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            <div>
              <Label>
                Discount Type
              </Label>

              <Select
                value={type}
                onValueChange={(
                  value
                ) =>
                  handleTypeChange(
                    value as DiscountType
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="SEASONAL">
                    Seasonal Discount
                  </SelectItem>

                  <SelectItem value="COUPON">
                    Coupon
                  </SelectItem>

                  <SelectItem value="CUSTOMER">
                    Customer Discount
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* SEASONAL TARGET */}

            {type ===
              "SEASONAL" && (
              <div>
                <Label>
                  Apply To
                </Label>

                <Select
                  value={target}
                  onValueChange={(
                    value
                  ) =>
                    handleTargetChange(
                      value as DiscountTarget
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="CATEGORY">
                      Category
                    </SelectItem>

                    <SelectItem value="PRODUCT">
                      Specific Product
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* COUPON */}

            {type === "COUPON" && (
              <div className="rounded-md border p-3 text-sm">
                <div className="font-medium">
                  Automatic Coupon
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  A unique coupon code will
                  be generated automatically
                  when you create this discount.
                </p>
              </div>
            )}

            {/* CUSTOMER */}

            {type ===
              "CUSTOMER" && (
              <div className="rounded-md border p-3 text-sm">
                <div className="font-medium">
                  Customer-Specific
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  This discount is assigned
                  to one specific customer.
                </p>
              </div>
            )}

            {/* NAME */}

            <div>
              <Label>
                Discount Name
              </Label>

              <Input
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                placeholder="Diwali Gold Offer"
              />
            </div>

          </CardContent>
        </Card>

        {/* =================================================
            CARD 2
        ================================================= */}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              2. Target
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* METAL */}

            <div>
              <Label>
                Metal
              </Label>

              <Select
                value={metal}
                onValueChange={(
                  value
                ) =>
                  handleMetalChange(
                    value as
                      | "Gold"
                      | "Silver"
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Gold">
                    Gold
                  </SelectItem>

                  <SelectItem value="Silver">
                    Silver
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* CUSTOMER */}

            {type ===
              "CUSTOMER" && (
              <div>
                <Label>
                  Customer ID
                </Label>

                <Input
                  value={userId}
                  onChange={(event) =>
                    setUserId(
                      event.target.value
                    )
                  }
                  placeholder="Enter customer ID"
                />

                <p className="text-xs text-muted-foreground mt-1">
                  Use the customer's
                  database user ID.
                </p>
              </div>
            )}

            {/* CATEGORY */}

            {type ===
              "SEASONAL" &&
              target ===
                "CATEGORY" && (
                <div>
                  <Label>
                    Category
                  </Label>

                  <Select
                    value={
                      category
                    }
                    onValueChange={
                      setCategory
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>

                    <SelectContent>
                      {availableCategories.map(
                        (
                          categoryItem
                        ) => (
                          <SelectItem
                            key={
                              categoryItem.id
                            }
                            value={
                              categoryItem.name
                            }
                          >
                            {
                              categoryItem.name
                            }
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>

                  {availableCategories.length ===
                    0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      No categories available
                      for {metal}.
                    </p>
                  )}
                </div>
              )}

            {/* PRODUCT */}

            {type ===
              "SEASONAL" &&
              target ===
                "PRODUCT" && (
                <div>
                  <Label>
                    Product
                  </Label>

                  <Select
                    value={
                      productId
                    }
                    onValueChange={
                      setProductId
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>

                    <SelectContent>
                      {availableProducts.map(
                        (
                          product
                        ) => (
                          <SelectItem
                            key={
                              product.id
                            }
                            value={
                              product.id
                            }
                          >
                            {
                              product.name
                            }
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>

                  {availableProducts.length ===
                    0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      No {metal} products
                      available.
                    </p>
                  )}
                </div>
              )}

            {/* COUPON TARGET */}

            {type ===
              "COUPON" && (
              <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                Target:{" "}
                <span className="font-medium text-foreground">
                  CART
                </span>
              </div>
            )}

          </CardContent>
        </Card>

        {/* =================================================
            CARD 3
        ================================================= */}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              3. Discount
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* KIND */}

            <div>
              <Label>
                Discount Type
              </Label>

              <Select
                value={kind}
                onValueChange={(
                  value
                ) =>
                  setKind(
                    value as DiscountKind
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="percent">
                    Percentage %
                  </SelectItem>

                  <SelectItem value="flat">
                    Flat ₹
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* VALUE */}

            <div>
              <Label>
                {kind === "percent"
                  ? "VA Discount %"
                  : "VA Discount ₹"}
              </Label>

              <Input
                type="number"
                min={0}
                max={
                  kind ===
                  "percent"
                    ? 100
                    : undefined
                }
                step="0.01"
                value={value}
                onChange={(event) =>
                  handleValueChange(
                    event.target
                      .value
                  )
                }
              />

              <p className="text-xs text-muted-foreground mt-1">
                Discount is applied only
                to VA / making charges.
              </p>
            </div>

            {/* AUTOMATIC COUPON INFO */}

            {type ===
              "COUPON" && (
              <div className="rounded-md border p-3">
                <p className="text-sm font-medium">
                  Coupon Code
                </p>

                <p className="text-xs text-muted-foreground mt-1">
                  Generated automatically
                  after clicking Create Discount.
                </p>
              </div>
            )}

            {/* DATES */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

              <div>
                <Label>
                  Start Date
                </Label>

                <Input
                  type="datetime-local"
                  value={
                    startDate
                  }
                  onChange={(event) =>
                    setStartDate(
                      event.target
                        .value
                    )
                  }
                />
              </div>

              <div>
                <Label>
                  End Date
                </Label>

                <Input
                  type="datetime-local"
                  value={
                    endDate
                  }
                  onChange={(event) =>
                    setEndDate(
                      event.target
                        .value
                    )
                  }
                />
              </div>

            </div>

            {/* USAGE */}

            {type ===
              "COUPON" && (
              <div>
                <Label>
                  Usage Limit
                </Label>

                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={
                    usageLimit
                  }
                  onChange={(event) =>
                    setUsageLimit(
                      event.target
                        .value ===
                        ""
                        ? ""
                        : Number(
                            event
                              .target
                              .value
                          )
                    )
                  }
                  placeholder="Unlimited"
                />

                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty for unlimited
                  usage.
                </p>
              </div>
            )}

            {/* CREATE */}

            <Button
              className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
              onClick={
                applyDiscount
              }
              disabled={
                applying
              }
            >
              {applying
                ? "Creating..."
                : "Create Discount"}
            </Button>

          </CardContent>
        </Card>

      </div>

      {/* =================================================
          DISCOUNTS TABLE
      ================================================= */}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Discounts
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">

          {discountsLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading discounts...
            </div>
          ) : (
            <Table>

              <TableHeader>
                <TableRow>

                  <TableHead>
                    Name
                  </TableHead>

                  <TableHead>
                    Type
                  </TableHead>

                  <TableHead>
                    Target
                  </TableHead>

                  <TableHead>
                    Discount
                  </TableHead>

                  <TableHead>
                    Code
                  </TableHead>

                  <TableHead>
                    Usage
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead>
                    Created
                  </TableHead>

                  <TableHead />

                </TableRow>
              </TableHeader>

              <TableBody>

                {discounts.map(
                  (
                    discount
                  ) => (
                    <TableRow
                      key={
                        discount.id
                      }
                    >

                      <TableCell className="font-medium">
                        {discount.name ||
                          "Untitled Discount"}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">
                          {
                            discount.type
                          }
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline">
                          {
                            discount.target
                          }
                        </Badge>
                      </TableCell>

                      <TableCell className="font-semibold">
                        {discount.kind ===
                        "percent"
                          ? `${discount.value}%`
                          : `₹${discount.value}`}

                        <span className="text-xs text-muted-foreground ml-1">
                          VA
                        </span>
                      </TableCell>

                      <TableCell className="font-mono text-sm">
                        {discount.code ||
                          "—"}
                      </TableCell>

                      <TableCell>
                        {discount.usageLimit !=
                        null
                          ? `${
                              discount.usageCount ??
                              0
                            }/${discount.usageLimit}`
                          : `${
                              discount.usageCount ??
                              0
                            }/∞`}
                      </TableCell>

                      <TableCell>
                        {discount.isActive ? (
                          <Badge>
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {String(
                          discount.createdAt
                        ).slice(
                          0,
                          10
                        )}
                      </TableCell>

                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleRemove(
                              discount.id
                            )
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>

                    </TableRow>
                  )
                )}

                {discounts.length ===
                  0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-muted-foreground py-8"
                    >
                      No discounts found
                    </TableCell>
                  </TableRow>
                )}

              </TableBody>

            </Table>
          )}

        </CardContent>
      </Card>
    </>
  );
}