import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader, StatusBadge } from "@/components/admin/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, FileSpreadsheet, FileText } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { adminApi } from "@/lib/adminApi";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/_admin/orders")({
  head: () => ({ meta: [{ title: "Orders — NVS Admin" }] }),
  component: OrdersPage,
});

type OrderRow = {
  id: string;
  customerName: string;
  customerLastName: string;
  customerEmail: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
  srAwbCode: string | null;
  srCourierName: string | null;
  items: { id: string; name: string; qty: number; sellingPrice: number }[];
};

const STAGES = ["Placed", "Confirmed", "Shipped", "Delivered", "Cancelled"];

function inr(n: number) {
  return `₹${(n || 0).toLocaleString("en-IN")}`;
}

function OrdersPage() {
  const nav = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    loadOrders();
  }, [status]);

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await adminApi.getOrders({ status });
      setOrders(res.orders || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  const filtered = orders.filter(
    (o) =>
      q === "" ||
      o.id.toLowerCase().includes(q.toLowerCase()) ||
      o.customerName.toLowerCase().includes(q.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(q.toLowerCase()) ||
      (o.srAwbCode || "").toLowerCase().includes(q.toLowerCase())
  );

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

  function itemsCount(o: OrderRow) {
    return o.items.reduce((s, i) => s + i.qty, 0);
  }

  // ---- Export: Excel ----
  function exportExcel() {
    const rows = filtered.map((o) => ({
      "Order ID": o.id,
      Customer: `${o.customerName} ${o.customerLastName !== "NA" ? o.customerLastName : ""}`.trim(),
      Email: o.customerEmail,
      Items: itemsCount(o),
      Amount: o.total,
      Payment: o.paymentStatus,
      "Payment Method": o.paymentMethod,
      Status: o.status,
      AWB: o.srAwbCode || "",
      Courier: o.srCourierName || "",
      Date: new Date(o.createdAt).toLocaleDateString("en-IN"),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, `orders-report-${Date.now()}.xlsx`);
  }

  // ---- Export: PDF ----
  function exportPdf() {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("NVS Jewellery — Orders Report", 14, 15);
    doc.setFontSize(9);
    doc.text(
      `Generated: ${new Date().toLocaleString("en-IN")} · ${filtered.length} orders · Total: ${inr(
        filtered.reduce((s, o) => s + o.total, 0)
      )}`,
      14,
      21
    );

    autoTable(doc, {
      startY: 26,
      head: [["Order ID", "Customer", "Items", "Amount", "Payment", "Status", "AWB", "Date"]],
      body: filtered.map((o) => [
        o.id.slice(-8).toUpperCase(),
        `${o.customerName} ${o.customerLastName !== "NA" ? o.customerLastName : ""}`.trim(),
        itemsCount(o),
        inr(o.total),
        o.paymentStatus,
        o.status,
        o.srAwbCode || "—",
        new Date(o.createdAt).toLocaleDateString("en-IN"),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [184, 134, 11] }, // gold tone
    });

    doc.save(`orders-report-${Date.now()}.pdf`);
  }

  return (
    <>
      <PageHeader
        title="Orders"
        description={`${orders.length} orders · ${inr(totalRevenue)} total revenue`}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-gold text-gold-foreground hover:bg-gold/90">
                <Download className="h-4 w-4 mr-1" />Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportPdf}>
                <FileText className="h-4 w-4 mr-2" />Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex gap-2 items-center flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search order ID, customer, AWB..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
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
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((o) => (
                  <TableRow
                    key={o.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => nav({ to: "/orders/$orderId", params: { orderId: o.id } })}
                  >
                    <TableCell className="font-medium">
                      {o.id.slice(-8).toUpperCase()}
                    </TableCell>
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