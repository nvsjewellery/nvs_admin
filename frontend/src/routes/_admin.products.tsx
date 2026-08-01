import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/admin/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter,
  SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { useAdmin } from "@/lib/admin-store";
import {
  calcGoldPrice, calcSilverPrice,
  inr, productTotal, type Product,
} from "@/lib/mock";

export const Route = createFileRoute("/_admin/products")({
  head: () => ({ meta: [{ title: "Products — NVS Admin" }] }),
  component: ProductsPage,
});

const EMPTY_GOLD: Partial<Product> = {
  metal: "Gold", purity: "22K", category: "", va: 12, gstRate: 3,
  grossWeight: 0, stoneWeight: 0, stoneCost: 0, status: "Draft",
  image: "",
};
const EMPTY_SILVER: Partial<Product> = {
  metal: "Silver", purity: "92.5", category: "", va: 20, gstRate: 3,
  grossWeight: 0, stoneWeight: 0, stoneCost: 0, isDirectSterling: false, pieceCost: 0, status: "Draft",
  image: "",
};

function ProductsPage() {
  const { products, productsLoading, rates, deleteProduct, bulkProductAction, categories } = useAdmin();
  const [q, setQ] = useState("");
  const [metal, setMetal] = useState<string>("all");
  const [cat, setCat] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Partial<Product> | null>(null);

  const filtered = products.filter((p) =>
    (metal === "all" || p.metal === metal) &&
    (cat === "all" || p.category === cat) &&
    (status === "all" || p.status === status) &&
    (q === "" || p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()))
  );

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  }

  async function bulk(action: "activate" | "deactivate" | "delete") {
    try {
      await bulkProductAction(Array.from(selected), action);
      toast.success(`${selected.size} products ${action}d`);
      setSelected(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk action failed");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteProduct(id);
      toast.success("Product deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <>
      <PageHeader
        title="Products"
        description={`${products.length} products across Gold and Silver categories.`}
        actions={
          <Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => setEditing(EMPTY_GOLD)}>
            <Plus className="h-4 w-4 mr-1" /> Add Product
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or SKU" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={metal} onValueChange={setMetal}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Metal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All metals</SelectItem>
              <SelectItem value="Gold">Gold</SelectItem>
              <SelectItem value="Silver">Silver</SelectItem>
            </SelectContent>
          </Select>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {Array.from(new Set(categories.map((c) => c.name))).map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          {selected.size > 0 && (
            <div className="flex gap-2 ml-auto">
              <Badge variant="secondary">{selected.size} selected</Badge>
              <Button size="sm" variant="outline" onClick={() => bulk("activate")}>Activate</Button>
              <Button size="sm" variant="outline" onClick={() => bulk("deactivate")}>Deactivate</Button>
              <Button size="sm" variant="destructive" onClick={() => bulk("delete")}>Delete</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {productsLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading products...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No products yet. Click "Add Product" to create one.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selected.size > 0 && selected.size === filtered.length}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Metal</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Purity</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(p.id)}
                        onCheckedChange={(v) => setSelected((s) => {
                          const n = new Set(s);
                          if (v) n.add(p.id); else n.delete(p.id);
                          return n;
                        })}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-muted overflow-hidden shrink-0 grid place-items-center">
                          {p.image ? <img src={p.image} alt={p.name} className="h-full w-full object-cover" /> : <Package className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate max-w-[220px]">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.sku}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={p.metal === "Gold" ? "text-gold-foreground font-medium" : "text-muted-foreground"}>{p.metal}</span>
                    </TableCell>
                    <TableCell className="text-sm">{p.category}</TableCell>
                    <TableCell className="text-sm">
                      {p.purity}
                      {p.isDirectSterling && <Badge variant="outline" className="ml-2 text-[10px]">Sterling</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.metal === "Gold" ? (
                        <>Net {((p.grossWeight ?? 0) - (p.stoneWeight ?? 0)).toFixed(2)}g · VA {p.va}% · GST {p.gstRate ?? 3}% · {p.hallmarkId}</>
                      ) : p.isDirectSterling ? (
                        <>Piece cost</>
                      ) : (
                        <>{p.grossWeight}g · VA {p.va}% · GST {p.gstRate ?? 3}%</>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums font-medium">{inr(p.livePrice ?? productTotal(p, rates))}</TableCell>
                    <TableCell className={p.stock < 3 ? "text-destructive font-medium" : ""}>{p.stock}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditing(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="p-3 flex items-center justify-between text-xs text-muted-foreground border-t">
            <div>Showing {filtered.length} of {products.length}</div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ProductSheet product={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function ProductSheet({
  product, onClose,
}: {
  product: Partial<Product> | null;
  onClose: () => void;
}) {
  const { rates, createProduct, updateProduct, categories } = useAdmin();
  const [p, setP] = useState<Partial<Product> | null>(product);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useMemo(() => {
    setP(product);
    setPendingFile(null);
    setPreviewUrl(null);
  }, [product]);

  if (!p) return null;

  const net = Math.max(0, (p.grossWeight ?? 0) - (p.stoneWeight ?? 0));
  const basePrice = p.metal === "Gold"
    ? calcGoldPrice({ grossWeight: p.grossWeight, stoneWeight: p.stoneWeight, stoneCost: p.stoneCost, purity: p.purity!, va: p.va }, rates)
    : calcSilverPrice(p as Product, rates);

  const gstPercentage = p.gstRate ?? 3;
  const calculatedGst = Math.round(basePrice.subtotal * (gstPercentage / 100));
  const calculatedTotal = basePrice.subtotal + calculatedGst;

  const isSilverSterlingAllowed = p.metal === "Silver" && p.purity === "92.5";
  const showWeightFields = p.metal === "Gold" || !p.isDirectSterling;

  const cats = categories.filter((c) => c.metal === p.metal).map((c) => c.name);
  const purities = p.metal === "Gold" ? ["9K", "14K", "18K", "22K"] : ["75", "80", "83.5", "92.5"];

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!p) return;
    setSaving(true);
    try {
      const finalSku = p.sku?.trim()
        ? p.sku
        : `NVS-${p.metal === "Gold" ? "G" : "S"}${p.category?.[0] ?? "X"}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;

      const payload = { ...p, sku: finalSku, gstRate: gstPercentage };

      if (p.id) {
        await updateProduct(p.id, payload, pendingFile);
        toast.success("Product updated");
      } else {
        await createProduct(payload, pendingFile);
        toast.success("Product created");
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const displayImage = previewUrl ?? p.image;

  return (
    <Sheet open={!!product} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{p.id ? "Edit Product" : "Add Product"}</SheetTitle>
          <SheetDescription>Fields adapt to the selected metal type.</SheetDescription>
        </SheetHeader>

        <div className="p-4 space-y-4">
          <div>
            <Label>Metal Type</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {(["Gold", "Silver"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setP((x) => x ? {
                    ...(m === "Gold" ? EMPTY_GOLD : EMPTY_SILVER),
                    ...x,
                    metal: m,
                    purity: m === "Gold" ? "22K" : "92.5",
                    category: "",
                    isDirectSterling: m === "Silver" ? false : undefined,
                  } : x)}
                  className={`p-3 rounded-md border text-left ${p.metal === m ? "border-gold bg-gold/10" : "hover:bg-muted"}`}
                >
                  <div className="font-medium">{m}</div>
                  <div className="text-xs text-muted-foreground">
                    {m === "Gold" ? "9K–22K purity, weight-based" : "75–92.5 purity, sterling option"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Product Name</Label>
              <Input value={p.name ?? ""} onChange={(e) => setP({ ...p, name: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea rows={3} value={p.description ?? ""} onChange={(e) => setP({ ...p, description: e.target.value })} />
            </div>

            {p.metal === "Silver" && (
              <div>
                <Label>Purity</Label>
                <Select value={p.purity} onValueChange={(v) => setP({ ...p, purity: v, isDirectSterling: v === "92.5" ? p.isDirectSterling : false })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{purities.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Category</Label>
              {cats.length === 0 ? (
                <p className="text-xs text-muted-foreground mt-1">
                  No {p.metal} categories yet — add one on the Categories page first.
                </p>
              ) : (
                <Select value={p.category} onValueChange={(v) => setP({ ...p, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>

            {p.metal === "Gold" && (
              <div>
                <Label>Carat / Purity</Label>
                <Select value={p.purity} onValueChange={(v) => setP({ ...p, purity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{purities.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}

            <div className="col-span-2">
              <Label>Photos</Label>
              <div className="mt-1 flex gap-2 flex-wrap items-center">
                {displayImage && (
                  <div className="h-20 w-20 rounded-md overflow-hidden border relative">
                    <img src={displayImage} alt="" className="h-full w-full object-cover" />
                    <Badge className="absolute top-1 left-1 bg-gold text-gold-foreground text-[9px] px-1 h-4">
                      {pendingFile ? "New" : "Primary"}
                    </Badge>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-20 w-20 rounded-md border-2 border-dashed grid place-items-center text-xs text-muted-foreground hover:bg-muted"
                >
                  + Upload
                </button>
              </div>
              {pendingFile && (
                <p className="text-xs text-muted-foreground mt-1">Will upload on save: {pendingFile.name}</p>
              )}
            </div>

            {isSilverSterlingAllowed && (
              <div className="col-span-2 flex items-center justify-between rounded-md border p-3 bg-muted/30">
                <div>
                  <Label>Direct Sterling (fixed piece price)?</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Bypasses rate-based pricing entirely.</p>
                </div>
                <Switch
                  checked={p.isDirectSterling ?? false}
                  onCheckedChange={(v) => setP({ ...p, isDirectSterling: v })}
                />
              </div>
            )}

            {p.metal === "Silver" && p.isDirectSterling && (
              <div className="col-span-2">
                <Label>Piece Cost (₹)</Label>
                <Input type="number" value={p.pieceCost ?? 0} onChange={(e) => setP({ ...p, pieceCost: Number(e.target.value) })} />
              </div>
            )}

            {showWeightFields && (
              <>
                <div>
                  <Label>{p.metal === "Gold" ? "Gross Weight (g)" : "Grams"}</Label>
                  <Input type="number" step="0.01" value={p.grossWeight ?? 0} onChange={(e) => setP({ ...p, grossWeight: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Stone Weight (g)</Label>
                  <Input type="number" step="0.01" value={p.stoneWeight ?? 0} onChange={(e) => setP({ ...p, stoneWeight: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Stone Cost (₹)</Label>
                  <Input type="number" value={p.stoneCost ?? 0} onChange={(e) => setP({ ...p, stoneCost: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Net Weight (g) — auto</Label>
                  <Input readOnly value={net.toFixed(3)} className="bg-muted" />
                </div>
                <div>
                  <Label>VA / Making Charges (%)</Label>
                  <Input type="number" step="0.5" value={p.va ?? 0} onChange={(e) => setP({ ...p, va: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>GST (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={p.gstRate ?? 3}
                    onChange={(e) => setP({ ...p, gstRate: Number(e.target.value) })}
                  />
                </div>
              </>
            )}

            {p.metal === "Gold" && (
              <div>
                <Label>Hallmark / Archive ID</Label>
                <Input value={p.hallmarkId ?? ""} onChange={(e) => setP({ ...p, hallmarkId: e.target.value })} />
              </div>
            )}

            <div>
              <Label>Item Code / SKU</Label>
              <Input
                value={p.sku ?? ""}
                placeholder={`NVS-${p.metal === "Gold" ? "G" : "S"}${p.category?.[0] ?? "X"}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`}
                onChange={(e) => setP({ ...p, sku: e.target.value })}
              />
            </div>

            <div>
              <Label>Stock</Label>
              <Input type="number" value={p.stock ?? 0} onChange={(e) => setP({ ...p, stock: Number(e.target.value) })} />
            </div>

            <div className="col-span-2">
              <Label>Status</Label>
              <Select value={p.status} onValueChange={(v) => setP({ ...p, status: v as Product["status"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border border-gold/40 bg-gold/5 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Live Price Preview</div>
            {p.metal === "Silver" && p.isDirectSterling ? (
              <div className="space-y-1 text-sm">
                <Row k="Piece Cost" v={inr(p.pieceCost ?? 0)} />
                <Row k={`GST (${gstPercentage}%)`} v={inr(calculatedGst)} />
                <div className="border-t my-2" />
                <Row k="Total" v={inr(calculatedTotal)} bold />
              </div>
            ) : (
              <div className="space-y-1 text-sm">
                <Row k={`Metal Value (${net.toFixed(2)}g × ${inr(basePrice.rate)}/g)`} v={inr(basePrice.metalVal)} />
                <Row k={`Making Charges (${p.va ?? 0}%)`} v={inr(basePrice.making)} />
                <Row k="Stone Cost" v={inr(p.stoneCost ?? 0)} />
                <Row k="Subtotal" v={inr(basePrice.subtotal)} />
                <Row k={`GST (${gstPercentage}%)`} v={inr(calculatedGst)} />
                <div className="border-t my-2" />
                <Row k="Total" v={inr(calculatedTotal)} bold />
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="p-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Product"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-display text-lg" : ""}`}>
      <span className="text-muted-foreground">{k}</span>
      <span className={`tabular-nums ${bold ? "text-foreground" : ""}`}>{v}</span>
    </div>
  );
}
