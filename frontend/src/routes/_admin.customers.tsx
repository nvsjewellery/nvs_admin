import { createFileRoute } from "@tanstack/react-router";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import {
  Search,
  Download,
  FileSpreadsheet,
  FileText,
  Copy,
} from "lucide-react";

import { PageHeader } from "@/components/admin/shared";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { adminApi } from "@/lib/adminApi";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute(
  "/_admin/customers"
)({
  head: () => ({
    meta: [
      {
        title: "Customers — NVS Admin",
      },
    ],
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

/* =========================================================
   CUSTOMERS CACHE
========================================================= */

let customersCache: Customer[] | null =
  null;

let customersPromise:
  | Promise<Customer[]>
  | null = null;

/* =========================================================
   LOAD CUSTOMERS
========================================================= */

async function loadCustomers(): Promise<
  Customer[]
> {
  /*
   * Return cached data immediately.
   */
  if (customersCache) {
    return customersCache;
  }

  /*
   * Prevent duplicate requests.
   */
  if (customersPromise) {
    return customersPromise;
  }

  customersPromise = adminApi
    .getCustomers()
    .then((res) => {
      const data =
        res.customers ?? [];

      customersCache = data;

      return data;
    })
    .finally(() => {
      customersPromise = null;
    });

  return customersPromise;
}

/* =========================================================
   CUSTOMERS PAGE
========================================================= */

function CustomersPage() {
  const [customers, setCustomers] =
    useState<Customer[]>(
      customersCache || []
    );

  const [loading, setLoading] =
    useState(
      !customersCache
    );

  const [search, setSearch] =
    useState("");

  const [selected, setSelected] =
    useState<Customer | null>(
      null
    );

  /* =======================================================
     LOAD CUSTOMER DATA
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    /*
     * Cache already exists.
     * No loading screen and no API call.
     */
    if (customersCache) {
      return () => {
        mounted = false;
      };
    }

    loadCustomers()
      .then((data) => {
        if (!mounted) {
          return;
        }

        setCustomers(data);
      })
      .catch((err: any) => {
        if (!mounted) {
          return;
        }

        toast.error(
          err.message ||
            "Failed to load customers"
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
     FILTER
  ======================================================= */

  const filtered = useMemo(() => {
    const q =
      search
        .toLowerCase()
        .trim();

    return customers.filter(
      (customer) => {
        return (
          customer.id
            .toLowerCase()
            .includes(q) ||
          customer.name
            .toLowerCase()
            .includes(q) ||
          customer.email
            .toLowerCase()
            .includes(q) ||
          (
            customer.phone ??
            ""
          ).includes(q)
        );
      }
    );
  }, [
    customers,
    search,
  ]);

  /* =======================================================
     COPY ID
  ======================================================= */

  const copyToClipboard = (
    text: string,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.stopPropagation();
    }

    navigator.clipboard.writeText(
      text
    );

    toast.success(
      "User ID copied to clipboard"
    );
  };

  /* =======================================================
     EXPORT EXCEL
  ======================================================= */

  function exportExcel() {
    if (filtered.length === 0) {
      toast.error(
        "No customers available to export"
      );

      return;
    }

    const rows = filtered.map(
      (customer) => ({
        "Customer ID":
          customer.id,
        Name: customer.name,
        Email: customer.email,
        Phone:
          customer.phone ||
          "",
        Addresses:
          customer.addresses,
        Wishlist:
          customer.wishlist,
        "Cart Items":
          customer.cart,
        Joined:
          new Date(
            customer.joined
          ).toLocaleDateString(
            "en-IN"
          ),
      })
    );

    const worksheet =
      XLSX.utils.json_to_sheet(
        rows
      );

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Customers"
    );

    XLSX.writeFile(
      workbook,
      `customers-report-${Date.now()}.xlsx`
    );

    toast.success(
      "Customers exported to Excel"
    );
  }

  /* =======================================================
     EXPORT PDF
  ======================================================= */

  function exportPdf() {
    if (filtered.length === 0) {
      toast.error(
        "No customers available to export"
      );

      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
    });

    doc.setFontSize(14);

    doc.text(
      "NVS Jewellery — Customers Report",
      14,
      15
    );

    doc.setFontSize(9);

    doc.text(
      `Generated: ${new Date().toLocaleString(
        "en-IN"
      )} · ${filtered.length} customers`,
      14,
      21
    );

    autoTable(doc, {
      startY: 26,

      head: [
        [
          "User ID",
          "Customer",
          "Email",
          "Phone",
          "Addresses",
          "Wishlist",
          "Cart",
          "Joined",
        ],
      ],

      body: filtered.map(
        (customer) => [
          customer.id,
          customer.name,
          customer.email,
          customer.phone ||
            "—",
          customer.addresses,
          customer.wishlist,
          customer.cart,
          new Date(
            customer.joined
          ).toLocaleDateString(
            "en-IN"
          ),
        ]
      ),

      styles: {
        fontSize: 8,
      },

      headStyles: {
        fillColor: [
          184,
          134,
          11,
        ],
      },
    });

    doc.save(
      `customers-report-${Date.now()}.pdf`
    );

    toast.success(
      "Customers exported to PDF"
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <PageHeader
        title="Customers"
        description={`${customers.length} Registered Customers`}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
            >
              <Button variant="outline">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={
                  exportExcel
                }
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={
                  exportPdf
                }
              >
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* SEARCH */}

      <Card className="mb-5">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              placeholder="Search customers by name, email, phone or User ID..."
              className="pl-9"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* CUSTOMER TABLE */}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-muted-foreground">
              Loading customers...
            </div>
          ) : filtered.length ===
            0 ? (
            <div className="p-10 text-center text-muted-foreground">
              No customers found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    User ID
                  </TableHead>

                  <TableHead>
                    Customer
                  </TableHead>

                  <TableHead>
                    Contact
                  </TableHead>

                  <TableHead>
                    Addresses
                  </TableHead>

                  <TableHead>
                    Wishlist
                  </TableHead>

                  <TableHead>
                    Cart
                  </TableHead>

                  <TableHead>
                    Joined
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.map(
                  (customer) => (
                    <TableRow
                      key={
                        customer.id
                      }
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() =>
                        setSelected(
                          customer
                        )
                      }
                    >
                      <TableCell
                        onClick={(e) =>
                          e.stopPropagation()
                        }
                      >
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono truncate max-w-[120px]">
                            {
                              customer.id
                            }
                          </code>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={(
                              e
                            ) =>
                              copyToClipboard(
                                customer.id,
                                e
                              )
                            }
                            title="Copy User ID"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-gold/20 text-gold-foreground">
                              {customer.name
                                .split(
                                  " "
                                )
                                .map(
                                  (n) =>
                                    n[0]
                                )
                                .join(
                                  ""
                                )}
                            </AvatarFallback>
                          </Avatar>

                          <div>
                            <div className="font-medium">
                              {
                                customer.name
                              }
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {
                            customer.email
                          }
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {
                            customer.phone ||
                            "-"
                          }
                        </div>
                      </TableCell>

                      <TableCell>
                        {
                          customer.addresses
                        }
                      </TableCell>

                      <TableCell>
                        {
                          customer.wishlist
                        }
                      </TableCell>

                      <TableCell>
                        {
                          customer.cart
                        }
                      </TableCell>

                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(
                          customer.joined
                        ).toLocaleDateString(
                          "en-IN"
                        )}
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* CUSTOMER DETAILS */}

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {
                    selected.name
                  }
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs uppercase text-muted-foreground mb-1">
                      Email
                    </div>

                    <div>
                      {
                        selected.email
                      }
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase text-muted-foreground mb-1">
                      Phone
                    </div>

                    <div>
                      {
                        selected.phone ||
                        "-"
                      }
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase text-muted-foreground mb-1">
                      Joined
                    </div>

                    <div>
                      {new Date(
                        selected.joined
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase text-muted-foreground mb-1">
                      Customer ID
                    </div>

                    <div className="flex items-center gap-2">
                      <code className="break-all text-xs bg-muted p-1.5 rounded font-mono">
                        {
                          selected.id
                        }
                      </code>

                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() =>
                          copyToClipboard(
                            selected.id
                          )
                        }
                        title="Copy Customer ID"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">
                        {
                          selected.addresses
                        }
                      </div>

                      <div className="text-xs text-muted-foreground mt-1">
                        Addresses
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">
                        {
                          selected.wishlist
                        }
                      </div>

                      <div className="text-xs text-muted-foreground mt-1">
                        Wishlist
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">
                        {
                          selected.cart
                        }
                      </div>

                      <div className="text-xs text-muted-foreground mt-1">
                        Cart Items
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end pt-2 border-t">
                  <Button
                    onClick={() =>
                      setSelected(
                        null
                      )
                    }
                  >
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