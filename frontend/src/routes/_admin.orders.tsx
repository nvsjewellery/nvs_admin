import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, StatusBadge } from "@/components/admin/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Printer, Plus } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ORDERS, inr, type Order } from "@/lib/mock";

export const Route = createFileRoute("/_admin/orders")({
  head: () => ({ meta: [{ title: "Orders — NVS Admin" }] }),
  component: OrdersPage,
});

const STAGES: Order["status"][] = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(ORDERS);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState<Order | null>(null);

  const filtered = orders.filter((o) =>
    (status === "all" || o.status === status) &&
    (q === "" || o.id.toLowerCase().includes(q.toLowerCase()) || o.customer.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <>
      <PageHeader
        title="Orders"
        description={`${orders.length} orders · ${inr(orders.reduce((s, o) => s + o.amount, 0))} total revenue`}
        actions={
          <Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => toast.success("Manual order form opened")}>
            <Plus className="h-4 w-4 mr-1" />Create Order
          </Button>
        }
      />

      <Tabs defaultValue="table">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <TabsList>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="kanban">Kanban Pipeline</TabsTrigger>
          </TabsList>
          <div className="flex gap-2 items-center flex-1 justify-end">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search orders" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
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

        <TabsContent value="table">
          <Card><CardContent className="p-0">
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
                {filtered.map((o) => (
                  <TableRow key={o.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setOpen(o)}>
                    <TableCell className="font-medium">{o.id}</TableCell>
                    <TableCell>{o.customer}</TableCell>
                    <TableCell>{o.items}</TableCell>
                    <TableCell className="tabular-nums">{inr(o.amount)}</TableCell>
                    <TableCell><StatusBadge status={o.payment} /></TableCell>
                    <TableCell><StatusBadge status={o.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{o.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="kanban">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {STAGES.map((stage) => {
              const inStage = orders.filter((o) => o.status === stage);
              return (
                <Card key={stage}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wider flex items-center justify-between">
                      {stage} <span className="text-muted-foreground">{inStage.length}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 min-h-[200px]">
                    {inStage.map((o) => (
                      <div key={o.id} onClick={() => setOpen(o)} className="p-2 rounded-md border bg-card cursor-pointer hover:border-gold">
                        <div className="text-xs font-medium">{o.id}</div>
                        <div className="text-xs text-muted-foreground">{o.customer}</div>
                        <div className="text-sm font-medium mt-1 tabular-nums">{inr(o.amount)}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!open} onOpenChange={(x) => !x && setOpen(null)}>
        <DialogContent className="max-w-2xl">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {open.id} <StatusBadge status={open.status} /> <StatusBadge status={open.payment} />
                </DialogTitle>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Customer</div>
                  <div className="font-medium">{open.customer}</div>
                  <div className="text-xs text-muted-foreground">Placed {open.date}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Total</div>
                  <div className="font-display text-2xl">{inr(open.amount)}</div>
                </div>
                <div className="md:col-span-2 border rounded-md p-3">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Items ({open.items}) — locked-in pricing</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm"><span>Radiance 22K Gold Ring · 6.2g @ ₹10,120/g · 12% VA</span><span className="tabular-nums">{inr(Math.round(open.amount * 0.6))}</span></div>
                    <div className="flex justify-between text-sm"><span>Silver Anklet Pair · 22.4g @ ₹96/g</span><span className="tabular-nums">{inr(Math.round(open.amount * 0.4))}</span></div>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Override Status</div>
                  <Select value={open.status} onValueChange={(v) => {
                    setOrders(orders.map((o) => o.id === open.id ? { ...o, status: v as Order["status"] } : o));
                    setOpen({ ...open, status: v as Order["status"] });
                    toast.success(`Status updated to ${v}`);
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}<SelectItem value="Returned">Returned</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <Button variant="outline"><Printer className="h-4 w-4 mr-1" />Print Invoice</Button>
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={() => toast.success("Refund initiated")}>Refund</Button>
                  <Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => toast.success("Shipping label generated")}>Ship Label</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
