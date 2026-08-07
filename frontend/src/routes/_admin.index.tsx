import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ShoppingBag, IndianRupee, Users, Package, AlertTriangle,
  TrendingUp, TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, StatusBadge } from "@/components/admin/shared";
import { adminApi } from "@/lib/adminApi";

export const Route = createFileRoute("/_admin/")({
  head: () => ({ meta: [{ title: "Dashboard — NVS Admin" }] }),
  component: Dashboard,
});

function inr(n: number) {
  return `₹${(n || 0).toLocaleString("en-IN")}`;
}

function Stat({ icon: Icon, label, value, delta, negative }: {
  icon: typeof ShoppingBag; label: string; value: string; delta?: string; negative?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className="font-display text-2xl mt-1">{value}</div>
          </div>
          <div className="h-9 w-9 rounded-md bg-gold/15 text-gold grid place-items-center">
            <Icon className="h-4 w-4" />
          </div>
        </div>
        {delta && (
          <div className={`mt-3 text-xs flex items-center gap-1 ${negative ? "text-destructive" : "text-success"}`}>
            {negative ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
            <span>{delta}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const LOW_STOCK_THRESHOLD = 5;

function Dashboard() {
  const nav = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        adminApi.getOrders(),
        adminApi.getCustomers(),
        adminApi.getProducts(),
      ]);

      setOrders(ordersRes.orders || []);
      setCustomerCount((customersRes.customers || customersRes.data || []).length);
      setProducts(productsRes.products || productsRes.data || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => (p.stock ?? 0) <= LOW_STOCK_THRESHOLD).length;

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  function itemsCount(o: any) {
    return (o.items || []).reduce((s: number, i: any) => s + i.qty, 0);
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of orders, revenue and inventory across NVS Jewellery."
        actions={<Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => nav({ to: "/orders" })}>View all orders</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon={ShoppingBag} label="Total Orders" value={loading ? "…" : totalOrders.toLocaleString("en-IN")} />
        <Stat icon={IndianRupee} label="Revenue" value={loading ? "…" : inr(totalRevenue)} />
        <Stat icon={Users} label="Customers" value={loading ? "…" : customerCount.toLocaleString("en-IN")} />
        <Stat icon={Package} label="Products" value={loading ? "…" : totalProducts.toLocaleString("en-IN")} />
      </div>

      {/* {!loading && lowStockCount > 0 && (
        <Card className="mb-6 border-destructive/40">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-sm">
              <span className="font-semibold">{lowStockCount}</span> product{lowStockCount !== 1 ? "s" : ""} at or below {LOW_STOCK_THRESHOLD} units in stock.
            </p>
          </CardContent>
        </Card>
      )} */}

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Orders</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No orders yet.
                  </TableCell>
                </TableRow>
              ) : (
                recentOrders.map((o) => (
                  <TableRow
                    key={o.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => nav({ to: "/orders/$orderId", params: { orderId: o.id } })}
                  >
                    <TableCell className="font-medium">{o.id.slice(-8).toUpperCase()}</TableCell>
                    <TableCell>
                      {o.customerName} {o.customerLastName !== "NA" ? o.customerLastName : ""}
                    </TableCell>
                    <TableCell>{itemsCount(o)}</TableCell>
                    <TableCell className="tabular-nums">{inr(o.total)}</TableCell>
                    <TableCell><StatusBadge status={o.paymentStatus} /></TableCell>
                    <TableCell><StatusBadge status={o.status} /></TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString("en-IN")}
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