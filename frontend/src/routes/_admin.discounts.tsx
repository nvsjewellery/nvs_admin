import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAdmin } from "@/lib/admin-store";
import { calcGoldPrice, calcSilverPrice, inr, productTotal } from "@/lib/mock";

export const Route = createFileRoute("/_admin/discounts")({
  head: () => ({ meta: [{ title: "Discounts — NVS Admin" }] }),
  component: DiscountsPage,
});

function DiscountsPage() {
  const { products, rates, discounts, discountsLoading, addDiscount, removeDiscount, categories } = useAdmin();
  const [metal, setMetal] = useState<"Gold" | "Silver">("Gold");
  const [category, setCategory] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scope, setScope] = useState<"VA" | "Total">("VA");
  const [kind, setKind] = useState<"percent" | "flat">("percent");
  const [value, setValue] = useState<number>(10);
  const [applying, setApplying] = useState(false);

  const cats = useMemo(() => categories.filter((c) => c.metal === metal).map((c) => c.name), [categories, metal]);

  const matching = useMemo(() =>
    products.filter((p) => p.metal === metal && p.category === category),
    [products, metal, category],
  );

  const preview = matching.map((p) => {
    const original = productTotal(p, rates);
    let discounted = original;
    if (metal === "Gold" && scope === "VA" && !p.isDirectSterling) {
      const reducedVA = Math.max(0, (p.va ?? 0) * (1 - value / 100));
      discounted = calcGoldPrice({ ...p, va: reducedVA }, rates).total;
    } else {
      discounted = kind === "percent" ? original * (1 - value / 100) : Math.max(0, original - value);
    }
    return { ...p, original, discounted, savings: original - discounted };
  });

  function toggleAll() {
    if (selected.size === matching.length) setSelected(new Set());
    else setSelected(new Set(matching.map((p) => p.id)));
  }

  async function apply() {
    if (selected.size === 0) return toast.error("Select at least one product");
    if (!category) return toast.error("Select a category");
    setApplying(true);
    try {
      await addDiscount({
        metal, category,
        productIds: Array.from(selected),
        scope: metal === "Gold" ? scope : "Total",
        kind: metal === "Gold" && scope === "VA" ? "percent" : kind,
        value,
      });
      toast.success(`Discount applied to ${selected.size} products`);
      setSelected(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to apply discount");
    } finally {
      setApplying(false);
    }
  }

  async function handleRemove(id: string) {
    try {
      await removeDiscount(id);
      toast.success("Discount removed. Pricing reverted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove discount");
    }
  }

  return (
    <>
      <PageHeader title="Discounts" description="Bulk discount across categories with live preview." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-base">1. Scope</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Metal Type</Label>
              <Select value={metal} onValueChange={(v) => { setMetal(v as "Gold" | "Silver"); setCategory(""); setSelected(new Set()); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gold">Gold</SelectItem>
                  <SelectItem value="Silver">Silver</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              {cats.length === 0 ? (
                <p className="text-xs text-muted-foreground mt-1">No {metal} categories yet.</p>
              ) : (
                <Select value={category} onValueChange={(v) => { setCategory(v); setSelected(new Set()); }}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">2. Discount</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {metal === "Gold" && (
              <div>
                <Label>Apply Discount On</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {(["VA", "Total"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setScope(s)}
                      className={`p-2 rounded-md border text-xs ${scope === s ? "border-gold bg-gold/10 font-medium" : ""}`}
                    >
                      {s === "VA" ? "Making Charges (VA)" : "Total Cost"}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(metal === "Silver" || scope === "Total") && (
              <div>
                <Label>Type</Label>
                <Select value={kind} onValueChange={(v) => setKind(v as "percent" | "flat")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage %</SelectItem>
                    <SelectItem value="flat">Flat ₹</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>{metal === "Gold" && scope === "VA" ? "VA Reduction %" : kind === "percent" ? "% off" : "₹ off"}</Label>
              <Input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">3. Apply</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <div className="text-muted-foreground">Selected products</div>
              <div className="font-display text-3xl">{selected.size}</div>
            </div>
            <div className="text-sm">
              <div className="text-muted-foreground">Total savings preview</div>
              <div className="font-display text-2xl text-gold-foreground">
                {inr(preview.filter((p) => selected.has(p.id)).reduce((s, p) => s + p.savings, 0))}
              </div>
            </div>
            <Button className="w-full bg-gold text-gold-foreground hover:bg-gold/90" onClick={apply} disabled={applying}>
              {applying ? "Applying..." : "Apply Discount"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Preview ({preview.length} matching products)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={selected.size === matching.length && matching.length > 0} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Original</TableHead>
                <TableHead>Discounted</TableHead>
                <TableHead>Savings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.map((p) => (
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
                  <TableCell className="font-medium">{p.name} <span className="text-xs text-muted-foreground">{p.sku}</span></TableCell>
                  <TableCell className="tabular-nums text-muted-foreground line-through">{inr(p.original)}</TableCell>
                  <TableCell className="tabular-nums font-semibold">{inr(p.discounted)}</TableCell>
                  <TableCell className="tabular-nums text-success">−{inr(p.savings)}</TableCell>
                </TableRow>
              ))}
              {preview.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No matching products</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Active Discounts</CardTitle></CardHeader>
        <CardContent className="p-0">
          {discountsLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading discounts...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metal / Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discounts.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.metal} / {d.category}</TableCell>
                    <TableCell><Badge variant="outline">{d.scope === "VA" ? "VA reduction" : d.kind === "percent" ? "% off total" : "₹ off total"}</Badge></TableCell>
                    <TableCell className="font-medium">{d.kind === "percent" ? `${d.value}%` : inr(d.value)}</TableCell>
                    <TableCell>{d.productIds.length}</TableCell>
                    <TableCell className="text-muted-foreground">{String(d.createdAt).slice(0, 10)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleRemove(d.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {discounts.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No active discounts</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}