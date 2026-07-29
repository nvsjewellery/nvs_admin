import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Search, Download } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/admin/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CUSTOMERS, ORDERS, inr, type Customer } from "@/lib/mock";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_admin/customers")({
  head: () => ({ meta: [{ title: "Customers — NVS Admin" }] }),
  component: CustomersPage,
});

function CustomersPage() {
  const [list, setList] = useState<Customer[]>(CUSTOMERS);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Customer | null>(null);
  const [note, setNote] = useState("");

  const filtered = list.filter((c) =>
    q === "" || c.name.toLowerCase().includes(q.toLowerCase()) || c.email.includes(q) || c.phone.includes(q),
  );

  return (
    <>
      <PageHeader
        title="Customers"
        description={`${list.length} customers · ${list.filter((c) => c.tags.includes("VIP")).length} VIP`}
        actions={<Button variant="outline"><Download className="h-4 w-4 mr-1" />Export CSV</Button>}
      />

      <Card className="mb-4"><CardContent className="p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, phone" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </CardContent></Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spend</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setOpen(c)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8"><AvatarFallback className="text-xs bg-gold/20 text-gold-foreground">{c.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                      <div className="font-medium">{c.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div>{c.email}</div>
                    <div className="text-xs">{c.phone}</div>
                  </TableCell>
                  <TableCell>{c.orders}</TableCell>
                  <TableCell className="tabular-nums font-medium">{inr(c.spend)}</TableCell>
                  <TableCell><div className="flex gap-1">{c.tags.map((t) => <Badge key={t} variant="outline" className={t === "VIP" ? "border-gold text-gold-foreground" : ""}>{t}</Badge>)}</div></TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.joined}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-2xl">
          {open && (
            <>
              <DialogHeader><DialogTitle>{open.name}</DialogTitle></DialogHeader>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Contact</div>
                  <div>{open.email}</div>
                  <div>{open.phone}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Stats</div>
                  <div>{open.orders} orders · {inr(open.spend)}</div>
                  <div className="text-muted-foreground text-xs">Joined {open.joined}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Order History</div>
                  <div className="border rounded-md divide-y">
                    {ORDERS.filter((o) => o.customer === open.name).map((o) => (
                      <div key={o.id} className="flex items-center justify-between p-2">
                        <span className="font-medium">{o.id}</span>
                        <span className="tabular-nums">{inr(o.amount)}</span>
                        <StatusBadge status={o.status} />
                        <span className="text-xs text-muted-foreground">{o.date}</span>
                      </div>
                    ))}
                    {ORDERS.filter((o) => o.customer === open.name).length === 0 && (
                      <div className="p-3 text-center text-xs text-muted-foreground">No orders yet</div>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Staff Notes</div>
                  <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note about this customer…" />
                </div>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <Button
                  variant={open.status === "Blocked" ? "outline" : "destructive"}
                  onClick={() => {
                    const s = open.status === "Blocked" ? "Active" : "Blocked";
                    setList(list.map((c) => c.id === open.id ? { ...c, status: s } : c));
                    setOpen({ ...open, status: s });
                    toast.success(`Customer ${s.toLowerCase()}`);
                  }}
                >
                  {open.status === "Blocked" ? "Unblock" : "Block Account"}
                </Button>
                <Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => toast.success("Note saved")}>Save Note</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
