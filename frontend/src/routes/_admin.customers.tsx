import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Download } from "lucide-react";

import { PageHeader } from "@/components/admin/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { adminApi } from "@/lib/adminApi";

export const Route = createFileRoute("/_admin/customers")({
  head: () => ({
    meta: [{ title: "Customers — NVS Admin" }],
  }),
  component: CustomersPage,
});

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  joined: string;
  addresses: number;
  wishlist: number;
  cart: number;
}

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminApi.getCustomers();
        setCustomers(res.customers ?? []);
      } catch (err: any) {
        toast.error(err.message || "Failed to load customers");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const q = search.toLowerCase();

      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q)
      );
    });
  }, [customers, search]);

  return (
    <>
      <PageHeader
        title="Customers"
        description={`${customers.length} Registered Customers`}
        actions={
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        }
      />

      <Card className="mb-5">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              placeholder="Search customers..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">

          {loading ? (

            <div className="p-10 text-center text-muted-foreground">
              Loading customers...
            </div>

          ) : (

            <Table>

              <TableHeader>

                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Addresses</TableHead>
                  <TableHead>Wishlist</TableHead>
                  <TableHead>Cart</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>

              </TableHeader>

              <TableBody>

                {filtered.map((customer) => (

                  <TableRow
                    key={customer.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => setSelected(customer)}
                  >

                    <TableCell>

                      <div className="flex items-center gap-3">

                        <Avatar className="h-9 w-9">

                          <AvatarFallback className="bg-gold/20 text-gold-foreground">

                            {customer.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}

                          </AvatarFallback>

                        </Avatar>

                        <div>

                          <div className="font-medium">
                            {customer.name}
                          </div>

                        </div>

                      </div>

                    </TableCell>

                    <TableCell>

                      <div className="text-sm">
                        {customer.email}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {customer.phone || "-"}
                      </div>

                    </TableCell>

                    <TableCell>

                      {customer.addresses}

                    </TableCell>

                    <TableCell>

                      {customer.wishlist}

                    </TableCell>

                    <TableCell>

                      {customer.cart}

                    </TableCell>

                    <TableCell className="text-muted-foreground text-xs">

                      {new Date(customer.joined).toLocaleDateString()}

                    </TableCell>

                  </TableRow>

                ))}

              </TableBody>

            </Table>

          )}

        </CardContent>
      </Card>
            <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-5 text-sm">

                <div className="grid grid-cols-2 gap-4">

                  <div>
                    <div className="text-xs uppercase text-muted-foreground mb-1">
                      Email
                    </div>
                    <div>{selected.email}</div>
                  </div>

                  <div>
                    <div className="text-xs uppercase text-muted-foreground mb-1">
                      Phone
                    </div>
                    <div>{selected.phone || "-"}</div>
                  </div>

                  <div>
                    <div className="text-xs uppercase text-muted-foreground mb-1">
                      Joined
                    </div>
                    <div>
                      {new Date(selected.joined).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase text-muted-foreground mb-1">
                      Customer ID
                    </div>
                    <div className="break-all">
                      {selected.id}
                    </div>
                  </div>

                </div>

                <div className="grid grid-cols-3 gap-4">

                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">
                        {selected.addresses}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Addresses
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">
                        {selected.wishlist}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Wishlist
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">
                        {selected.cart}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Cart Items
                      </div>
                    </CardContent>
                  </Card>

                </div>

                <div className="flex justify-end pt-2 border-t">
                  <Button onClick={() => setSelected(null)}>
                    Close
                  </Button>
                </div>

              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}