import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, StatusBadge } from "@/components/admin/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Printer, Truck, MapPin, CheckCircle2, Package } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { SHIPMENTS, inr, type Shipment } from "@/lib/mock";

export const Route = createFileRoute("/_admin/shipping")({
  head: () => ({ meta: [{ title: "Shipping & Tracking — NVS Admin" }] }),
  component: ShippingPage,
});

function ShippingPage() {
  const [list] = useState<Shipment[]>(SHIPMENTS);
  const [open, setOpen] = useState<Shipment | null>(null);
  const [freeThreshold, setFreeThreshold] = useState(5000);
  const [cod, setCod] = useState(true);

  return (
    <>
      <PageHeader
        title="Shipping / Tracking"
        description="Live shipment status, courier rules, and label generation."
        actions={
          <Button variant="outline" onClick={() => toast.success("Bulk manifest generated")}>
            <Printer className="h-4 w-4 mr-1" />Bulk Labels
          </Button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Shipments</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>AWB</TableHead>
                  <TableHead>Courier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>ETA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setOpen(s)}>
                    <TableCell className="font-medium">{s.orderId}</TableCell>
                    <TableCell className="font-mono text-xs">{s.awb}</TableCell>
                    <TableCell>{s.courier}</TableCell>
                    <TableCell><StatusBadge status={s.status} /></TableCell>
                    <TableCell className="text-muted-foreground text-xs">{s.updated}</TableCell>
                    <TableCell className="text-muted-foreground">{s.eta}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Shipping Rules</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Free shipping threshold (₹)</Label>
              <Input type="number" value={freeThreshold} onChange={(e) => setFreeThreshold(Number(e.target.value))} />
              <p className="text-xs text-muted-foreground mt-1">Orders above {inr(freeThreshold)} qualify for free shipping.</p>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>Cash on Delivery</Label>
                <p className="text-xs text-muted-foreground">Globally enable/disable COD</p>
              </div>
              <Switch checked={cod} onCheckedChange={setCod} />
            </div>
            <div>
              <Label className="mb-2 block">Per-region charges (₹)</Label>
              {[["North", 120], ["South", 100], ["East", 140], ["West", 100]].map(([r, v]) => (
                <div key={r as string} className="flex items-center gap-2 mb-1.5">
                  <div className="w-20 text-sm">{r}</div>
                  <Input type="number" defaultValue={v as number} className="flex-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-lg">
          {open && (
            <>
              <DialogHeader><DialogTitle className="flex items-center gap-2">{open.orderId} <StatusBadge status={open.status} /></DialogTitle></DialogHeader>
              <div className="space-y-1 text-sm">
                <div><b>AWB:</b> <span className="font-mono">{open.awb}</span></div>
                <div><b>Courier:</b> {open.courier}</div>
                <div><b>ETA:</b> {open.eta}</div>
              </div>
              <div className="mt-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Tracking Timeline</div>
                <div className="relative pl-6 space-y-3">
                  {[
                    { icon: Package, t: "Booked", d: "2026-07-11 10:30", done: true },
                    { icon: Truck, t: "Picked up", d: "2026-07-11 18:00", done: true },
                    { icon: MapPin, t: "In transit — Mumbai hub", d: "2026-07-12 06:20", done: true },
                    { icon: MapPin, t: "Out for delivery", d: "2026-07-13 08:00", done: open.status === "Out for Delivery" || open.status === "Delivered" },
                    { icon: CheckCircle2, t: "Delivered", d: "2026-07-13 14:22", done: open.status === "Delivered" },
                  ].map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`absolute left-0 h-6 w-6 rounded-full grid place-items-center ${step.done ? "bg-gold text-gold-foreground" : "bg-muted text-muted-foreground"}`}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium">{step.t}</div>
                          <div className="text-xs text-muted-foreground">{step.d}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
