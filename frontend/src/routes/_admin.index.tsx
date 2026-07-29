import { createFileRoute } from "@tanstack/react-router";
import {
  ShoppingBag, IndianRupee, Users, Package, AlertTriangle,
  TrendingUp, TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, StatusBadge } from "@/components/admin/shared";
import { ORDERS, inr } from "@/lib/mock";

export const Route = createFileRoute("/_admin/")({
  head: () => ({ meta: [{ title: "Dashboard — NVS Admin" }] }),
  component: Dashboard,
});

function Stat({ icon: Icon, label, value, delta, negative }: {
  icon: typeof ShoppingBag; label: string; value: string; delta: string; negative?: boolean;
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
        <div className={`mt-3 text-xs flex items-center gap-1 ${negative ? "text-destructive" : "text-success"}`}>
          {negative ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
          <span>{delta}</span>
          <span className="text-muted-foreground ml-1">this month</span>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of orders, revenue and inventory across NVS Jewellery."
        actions={<Button className="bg-gold text-gold-foreground hover:bg-gold/90">Download report</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Stat icon={ShoppingBag} label="Total Orders" value="1,284" delta="+12.4%" />
        <Stat icon={IndianRupee} label="Revenue" value={inr(48720000)} delta="+8.2%" />
        <Stat icon={Users} label="Customers" value="3,412" delta="+5.1%" />
        <Stat icon={Package} label="Products" value="184" delta="+3 new" />
        <Stat icon={AlertTriangle} label="Low Stock" value="9" delta="-2 vs last mo" negative />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Orders</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ORDERS.slice(0, 8).map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.id}</TableCell>
                  <TableCell>{o.customer}</TableCell>
                  <TableCell className="tabular-nums">{inr(o.amount)}</TableCell>
                  <TableCell><StatusBadge status={o.payment} /></TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{o.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
