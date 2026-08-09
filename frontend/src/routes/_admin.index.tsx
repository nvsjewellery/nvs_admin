import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ShoppingBag,
  IndianRupee,
  Users,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  PageHeader,
  StatusBadge,
} from "@/components/admin/shared";

import { adminApi } from "@/lib/adminApi";

/* =========================================================
   ROUTE
========================================================= */

export const Route = createFileRoute("/_admin/")({
  head: () => ({
    meta: [{ title: "Dashboard — NVS Admin" }],
  }),
  component: Dashboard,
});

/* =========================================================
   HELPERS
========================================================= */

function inr(n: number) {
  return `₹${(n || 0).toLocaleString("en-IN")}`;
}

/* =========================================================
   STAT CARD
========================================================= */

function Stat({
  icon: Icon,
  label,
  value,
  delta,
  negative,
}: {
  icon: typeof ShoppingBag;
  label: string;
  value: string;
  delta?: string;
  negative?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              {label}
            </p>

            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {value}
            </p>

            {delta && (
              <div
                className={`mt-3 text-xs flex items-center gap-1 ${
                  negative
                    ? "text-destructive"
                    : "text-success"
                }`}
              >
                {negative ? (
                  <TrendingDown className="h-3.5 w-3.5" />
                ) : (
                  <TrendingUp className="h-3.5 w-3.5" />
                )}

                {delta}
              </div>
            )}
          </div>

          <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-gold" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   LOW STOCK
========================================================= */

const LOW_STOCK_THRESHOLD = 5;

/* =========================================================
   DASHBOARD CACHE
========================================================= */

type DashboardCache = {
  orders: any[];
  customerCount: number;
  products: any[];
};

/*
 * IMPORTANT:
 *
 * This cache lives outside the React component.
 *
 * Therefore when the user navigates:
 *
 * Dashboard
 *    ↓
 * Customers
 *    ↓
 * Orders
 *    ↓
 * Dashboard
 *
 * the dashboard data is still available.
 */
let dashboardCache: DashboardCache | null = null;

/*
 * Prevent duplicate API requests when multiple
 * components/effects try to load the dashboard
 * at the same time.
 */
let dashboardPromise: Promise<DashboardCache> | null =
  null;

/* =========================================================
   LOAD DASHBOARD DATA
========================================================= */

async function loadDashboardData(): Promise<DashboardCache> {
  /*
   * -------------------------------------------------------
   * CACHE HIT
   * -------------------------------------------------------
   *
   * If dashboard data already exists, immediately
   * return it without making another API request.
   */
  if (dashboardCache) {
    return dashboardCache;
  }

  /*
   * -------------------------------------------------------
   * REQUEST ALREADY IN PROGRESS
   * -------------------------------------------------------
   *
   * If another component/effect already started
   * loading the dashboard, reuse that same Promise.
   */
  if (dashboardPromise) {
    return dashboardPromise;
  }

  /*
   * -------------------------------------------------------
   * FIRST LOAD
   * -------------------------------------------------------
   */

  dashboardPromise = Promise.all([
    adminApi.getOrders(),
    adminApi.getCustomers(),
    adminApi.getProducts(),
  ])
    .then(
      ([
        ordersRes,
        customersRes,
        productsRes,
      ]) => {
        const result: DashboardCache = {
          orders:
            ordersRes.orders || [],

          customerCount:
            (
              customersRes.customers ||
              customersRes.data ||
              []
            ).length,

          products:
            productsRes.products ||
            productsRes.data ||
            [],
        };

        /*
         * Save successful response in cache.
         */
        dashboardCache = result;

        return result;
      }
    )
    .finally(() => {
      /*
       * Request is finished.
       *
       * Keep dashboardCache.
       *
       * Only clear the Promise reference.
       */
      dashboardPromise = null;
    });

  return dashboardPromise;
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard() {
  const nav = useNavigate();

  /*
   * -------------------------------------------------------
   * INITIAL STATE
   * -------------------------------------------------------
   *
   * If cache already exists, initialize directly from it.
   *
   * This means returning to the dashboard does NOT show
   * a loading state.
   */

  const [orders, setOrders] = useState<any[]>(
    dashboardCache?.orders || []
  );

  const [customerCount, setCustomerCount] =
    useState(
      dashboardCache?.customerCount || 0
    );

  const [products, setProducts] = useState<any[]>(
    dashboardCache?.products || []
  );

  const [loading, setLoading] = useState(
    !dashboardCache
  );

  /* =======================================================
     LOAD ONLY WHEN CACHE DOES NOT EXIST
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    /*
     * If cache already exists, there is absolutely
     * nothing to fetch.
     */
    if (dashboardCache) {
      return () => {
        mounted = false;
      };
    }

    loadDashboardData()
      .then((data) => {
        if (!mounted) {
          return;
        }

        setOrders(data.orders);

        setCustomerCount(
          data.customerCount
        );

        setProducts(data.products);
      })
      .catch((err: any) => {
        if (!mounted) {
          return;
        }

        toast.error(
          err?.message ||
            "Failed to load dashboard data"
        );
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     DASHBOARD CALCULATIONS
  ======================================================= */

  const totalRevenue = orders.reduce(
    (s, o) =>
      s + (o.total || 0),
    0
  );

  const totalOrders =
    orders.length;

  const totalProducts =
    products.length;

  const lowStockCount =
    products.filter(
      (p) =>
        (p.stock ?? 0) <=
        LOW_STOCK_THRESHOLD
    ).length;

  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(
          b.createdAt
        ).getTime() -
        new Date(
          a.createdAt
        ).getTime()
    )
    .slice(0, 8);

  function itemsCount(o: any) {
    return (o.items || []).reduce(
      (s: number, i: any) =>
        s + i.qty,
      0
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <PageHeader
        title="Dashboard"
        description="Overview of orders, revenue and inventory across NVS Jewellery."
        actions={
          <Button
            className="bg-gold text-gold-foreground hover:bg-gold/90"
            onClick={() =>
              nav({
                to: "/orders",
              })
            }
          >
            View all orders
          </Button>
        }
      />

      {/* =================================================
          STAT CARDS
      ================================================= */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat
          icon={ShoppingBag}
          label="Total Orders"
          value={
            loading
              ? "…"
              : totalOrders.toLocaleString(
                  "en-IN"
                )
          }
        />

        <Stat
          icon={IndianRupee}
          label="Revenue"
          value={
            loading
              ? "…"
              : inr(totalRevenue)
          }
        />

        <Stat
          icon={Users}
          label="Customers"
          value={
            loading
              ? "…"
              : customerCount.toLocaleString(
                  "en-IN"
                )
          }
        />

        <Stat
          icon={Package}
          label="Products"
          value={
            loading
              ? "…"
              : totalProducts.toLocaleString(
                  "en-IN"
                )
          }
        />
      </div>

      {/* =================================================
          LOW STOCK
      ================================================= */}

      {/* {!loading && lowStockCount > 0 && (
        <Card className="mb-6 border-destructive/40">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />

            <p className="text-sm">
              <span className="font-semibold">
                {lowStockCount}
              </span>{" "}
              product
              {lowStockCount !== 1
                ? "s"
                : ""}{" "}
              at or below{" "}
              {LOW_STOCK_THRESHOLD}{" "}
              units in stock.
            </p>
          </CardContent>
        </Card>
      )} */}

      {/* =================================================
          RECENT ORDERS
      ================================================= */}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Recent Orders
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  Order
                </TableHead>

                <TableHead>
                  Customer
                </TableHead>

                <TableHead>
                  Items
                </TableHead>

                <TableHead>
                  Amount
                </TableHead>

                <TableHead>
                  Payment
                </TableHead>

                <TableHead>
                  Status
                </TableHead>

                <TableHead>
                  Date
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No orders yet.
                  </TableCell>
                </TableRow>
              ) : (
                recentOrders.map((o) => (
                  <TableRow
                    key={o.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      nav({
                        to: "/orders/$orderId",
                        params: {
                          orderId: o.id,
                        },
                      })
                    }
                  >
                    <TableCell className="font-medium">
                      {o.id
                        .slice(-8)
                        .toUpperCase()}
                    </TableCell>

                    <TableCell>
                      {o.customerName}{" "}
                      {o.customerLastName !==
                      "NA"
                        ? o.customerLastName
                        : ""}
                    </TableCell>

                    <TableCell>
                      {itemsCount(o)}
                    </TableCell>

                    <TableCell className="tabular-nums">
                      {inr(o.total)}
                    </TableCell>

                    <TableCell>
                      <StatusBadge
                        status={
                          o.paymentStatus
                        }
                      />
                    </TableCell>

                    <TableCell>
                      <StatusBadge
                        status={
                          o.status
                        }
                      />
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {new Date(
                        o.createdAt
                      ).toLocaleDateString(
                        "en-IN"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}