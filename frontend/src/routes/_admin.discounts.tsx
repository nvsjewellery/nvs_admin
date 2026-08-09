import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

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

export const Route = createFileRoute("/_admin/discounts")({
  head: () => ({
    meta: [{ title: "Discounts — NVS Admin" }],
  }),
  component: DiscountsPage,
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
    useState<DiscountType>("SEASONAL");

  const [target, setTarget] =
    useState<DiscountTarget>("CATEGORY");

  const [kind, setKind] =
    useState<DiscountKind>("percent");

  const [metal, setMetal] =
    useState<"Gold" | "Silver">("Gold");

  const [category, setCategory] =
    useState("");

  const [productId, setProductId] =
    useState("");

  const [userId, setUserId] =
    useState("");

  const [name, setName] =
    useState("");

  const [code, setCode] =
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
     AVAILABLE CATEGORIES
  ======================================================= */

  const availableCategories = useMemo(() => {
    return categories.filter(
      (categoryItem) =>
        categoryItem.metal === metal
    );
  }, [categories, metal]);

  /* =======================================================
     AVAILABLE PRODUCTS
  ======================================================= */

  const availableProducts = useMemo(() => {
    return products.filter(
      (product) =>
        product.metal === metal
    );
  }, [products, metal]);

  /* =======================================================
     TYPE CHANGE
  ======================================================= */

  function handleTypeChange(
    nextType: DiscountType
  ) {
    setType(nextType);

    /*
     * Reset fields whenever the discount type changes.
     */

    setCategory("");
    setProductId("");
    setUserId("");
    setCode("");
    setStartDate("");
    setEndDate("");
    setUsageLimit("");
    setValue(10);
    setKind("percent");

    /*
     * Target rules:
     *
     * SEASONAL -> PRODUCT / CATEGORY
     * COUPON   -> CART
     * CUSTOMER -> CUSTOMER
     */

    if (nextType === "COUPON") {
      setTarget("CART");
      return;
    }

    if (nextType === "CUSTOMER") {
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
    nextMetal: "Gold" | "Silver"
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

    if (!Number.isFinite(numericValue)) {
      return;
    }

    setValue(numericValue);
  }

  /* =======================================================
     CREATE DISCOUNT
  ======================================================= */

  async function applyDiscount() {
    /* -----------------------------------------------
       Name
    ----------------------------------------------- */

    if (!name.trim()) {
      toast.error(
        "Enter a discount name"
      );
      return;
    }

    /* -----------------------------------------------
       Coupon code
    ----------------------------------------------- */

    if (
      type === "COUPON" &&
      !code.trim()
    ) {
      toast.error(
        "Enter a coupon code"
      );
      return;
    }

    /* -----------------------------------------------
       Customer
    ----------------------------------------------- */

    if (
      type === "CUSTOMER" &&
      !userId.trim()
    ) {
      toast.error(
        "Enter the customer ID"
      );
      return;
    }

    /* -----------------------------------------------
       Seasonal category
    ----------------------------------------------- */

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

    /* -----------------------------------------------
       Seasonal product
    ----------------------------------------------- */

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

    /* -----------------------------------------------
       Discount value
    ----------------------------------------------- */

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      toast.error(
        "Discount value must be greater than 0"
      );
      return;
    }

    /*
     * Percentage cannot exceed 100%.
     *
     * Flat discount has no 100 limit because
     * it represents a fixed ₹ amount.
     */

    if (
      kind === "percent" &&
      value > 100
    ) {
      toast.error(
        "Percentage discount cannot exceed 100%"
      );
      return;
    }

    /* -----------------------------------------------
       Date validation
    ----------------------------------------------- */

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

    /* -----------------------------------------------
       Usage limit
    ----------------------------------------------- */

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

    try {
      /*
       * Build the backend payload.
       *
       * IMPORTANT:
       * There is NO "scope" field.
       */

      await addDiscount({
        name: name.trim(),

        type,

        target,

        kind,

        /*
         * value always represents VA discount.
         */

        value,

        code:
          type === "COUPON"
            ? code
                .trim()
                .toUpperCase()
            : null,

        metal,

        category:
          type === "SEASONAL" &&
          target === "CATEGORY"
            ? category
            : null,

        productIds:
          type === "SEASONAL" &&
          target === "PRODUCT"
            ? [productId]
            : [],

        userId:
          type === "CUSTOMER"
            ? userId.trim()
            : null,

        startDate:
          startDate || null,

        endDate:
          endDate || null,

        usageLimit:
          usageLimit === ""
            ? null
            : Number(usageLimit),

        isActive: true,
      });

      toast.success(
        "Discount created successfully"
      );

      /* -----------------------------------------------
         Reset form
      ----------------------------------------------- */

      setName("");
      setCode("");
      setCategory("");
      setProductId("");
      setUserId("");
      setValue(10);
      setStartDate("");
      setEndDate("");
      setUsageLimit("");
      setKind("percent");

      if (type === "COUPON") {
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
     DELETE DISCOUNT
  ======================================================= */

  async function handleRemove(
    id: string
  ) {
    try {
      await removeDiscount(id);

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
          CREATE DISCOUNT
      ================================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        {/* =================================================
            CARD 1 — TYPE
        ================================================= */}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              1. Discount Type
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* TYPE */}

            <div>
              <Label>
                Discount Type
              </Label>

              <Select
                value={type}
                onValueChange={(value) =>
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

            {/* TARGET */}

            {type === "SEASONAL" && (
              <div>
                <Label>
                  Apply To
                </Label>

                <Select
                  value={target}
                  onValueChange={(value) =>
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

            {/* COUPON TARGET */}

            {type === "COUPON" && (
              <div className="rounded-md border p-3 text-sm">
                <div className="font-medium">
                  Cart Coupon
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  This coupon applies to eligible
                  cart items and reduces VA /
                  making charges only.
                </p>
              </div>
            )}

            {/* CUSTOMER TARGET */}

            {type === "CUSTOMER" && (
              <div className="rounded-md border p-3 text-sm">
                <div className="font-medium">
                  Customer-Specific
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  This discount is assigned to
                  one specific customer.
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
            CARD 2 — TARGET
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
                onValueChange={(value) =>
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

            {type === "CUSTOMER" && (
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
                  Use the customer's database
                  user ID.
                </p>
              </div>
            )}

            {/* CATEGORY */}

            {type === "SEASONAL" &&
              target === "CATEGORY" && (
                <div>
                  <Label>
                    Category
                  </Label>

                  <Select
                    value={category}
                    onValueChange={
                      setCategory
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>

                    <SelectContent>
                      {availableCategories.map(
                        (categoryItem) => (
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

            {type === "SEASONAL" &&
              target === "PRODUCT" && (
                <div>
                  <Label>
                    Product
                  </Label>

                  <Select
                    value={productId}
                    onValueChange={
                      setProductId
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>

                    <SelectContent>
                      {availableProducts.map(
                        (product) => (
                          <SelectItem
                            key={
                              product.id
                            }
                            value={
                              product.id
                            }
                          >
                            {product.name}
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

            {/* COUPON INFORMATION */}

            {type === "COUPON" && (
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
            CARD 3 — VALUE
        ================================================= */}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              3. Discount
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* DISCOUNT KIND */}

            <div>
              <Label>
                Discount Type
              </Label>

              <Select
                value={kind}
                onValueChange={(value) =>
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
                  kind === "percent"
                    ? 100
                    : undefined
                }
                step="0.01"
                value={value}
                onChange={(event) =>
                  handleValueChange(
                    event.target.value
                  )
                }
              />

              <p className="text-xs text-muted-foreground mt-1">
                Discount is applied only to
                VA / making charges.
              </p>
            </div>

            {/* COUPON CODE */}

            {type === "COUPON" && (
              <div>
                <Label>
                  Coupon Code
                </Label>

                <Input
                  value={code}
                  onChange={(event) =>
                    setCode(
                      event.target.value
                        .toUpperCase()
                    )
                  }
                  placeholder="DIWALI10"
                />
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
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(
                      event.target.value
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
                  value={endDate}
                  onChange={(event) =>
                    setEndDate(
                      event.target.value
                    )
                  }
                />
              </div>

            </div>

            {/* USAGE LIMIT */}

            {type === "COUPON" && (
              <div>
                <Label>
                  Usage Limit
                </Label>

                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={usageLimit}
                  onChange={(event) =>
                    setUsageLimit(
                      event.target.value ===
                        ""
                        ? ""
                        : Number(
                            event.target
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
              onClick={applyDiscount}
              disabled={applying}
            >
              {applying
                ? "Creating..."
                : "Create Discount"}
            </Button>

          </CardContent>
        </Card>

      </div>

      {/* =================================================
          ACTIVE DISCOUNTS
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
                  (discount: Discount) => (
                    <TableRow
                      key={
                        discount.id
                      }
                    >

                      {/* NAME */}

                      <TableCell className="font-medium">
                        {discount.name ||
                          "Untitled Discount"}
                      </TableCell>

                      {/* TYPE */}

                      <TableCell>
                        <Badge variant="outline">
                          {discount.type}
                        </Badge>
                      </TableCell>

                      {/* TARGET */}

                      <TableCell>
                        <Badge variant="outline">
                          {discount.target}
                        </Badge>
                      </TableCell>

                      {/* VALUE */}

                      <TableCell className="font-semibold">
                        {discount.kind ===
                        "percent"
                          ? `${discount.value}%`
                          : `₹${discount.value}`}

                        <span className="text-xs text-muted-foreground ml-1">
                          VA
                        </span>
                      </TableCell>

                      {/* CODE */}

                      <TableCell>
                        {discount.code ||
                          "—"}
                      </TableCell>

                      {/* USAGE */}

                      <TableCell>
                        {discount.usageLimit !=
                          null
                          ? `${discount.usageCount ?? 0}/${discount.usageLimit}`
                          : `${discount.usageCount ?? 0}/∞`}
                      </TableCell>

                      {/* STATUS */}

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

                      {/* CREATED */}

                      <TableCell className="text-muted-foreground">
                        {String(
                          discount.createdAt
                        ).slice(
                          0,
                          10
                        )}
                      </TableCell>

                      {/* DELETE */}

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