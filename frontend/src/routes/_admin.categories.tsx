import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/admin/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAdmin } from "@/lib/admin-store";

export const Route = createFileRoute("/_admin/categories")({
  head: () => ({ meta: [{ title: "Categories — NVS Admin" }] }),
  component: CategoriesPage,
});

type Cat = { id: string; metal: "Gold" | "Silver"; name: string; slug: string; metaTitle: string; metaDesc: string; image: string; sortOrder: number };

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function CategoriesPage() {
  const { categories, categoriesLoading, createCategory, updateCategory, deleteCategory, reorderCategories } = useAdmin();
  const [editing, setEditing] = useState<Partial<Cat> | null>(null);
  const [saving, setSaving] = useState(false);

  const gold = useMemo(() => categories.filter((c) => c.metal === "Gold"), [categories]);
  const silver = useMemo(() => categories.filter((c) => c.metal === "Silver"), [categories]);

  async function move(list: Cat[], idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= list.length) return;
    const copy = [...list];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    try {
      await reorderCategories(copy.map((c) => c.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reorder failed");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCategory(id);
      toast.success("Sub-category deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  function handleAddClick(metal: "Gold" | "Silver") {
    setEditing({ metal, name: "", metaDesc: "" });
  }

  async function handleSaveEdit() {
    if (!editing) return;
    if (!editing.name?.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const slug = slugify(editing.name);
      if (editing.id) {
        await updateCategory(editing.id, {
          name: editing.name,
          slug,
          metaTitle: "",
          metaDesc: editing.metaDesc ?? "",
          image: editing.image ?? "",
        });
        toast.success("Category updated");
      } else {
        await createCategory({
          metal: editing.metal,
          name: editing.name,
          slug,
          metaTitle: "",
          metaDesc: editing.metaDesc ?? "",
          image: "",
        });
        toast.success("Sub-category created");
      }
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const render = (metal: "Gold" | "Silver", list: Cat[]) => (
    <div className="space-y-2">
      {list.map((c, i) => (
        <div key={c.id} className="flex items-center gap-3 p-3 rounded-md border bg-card">
          <div className="h-10 w-14 rounded bg-muted overflow-hidden shrink-0 grid place-items-center">
            {c.image ? <img src={c.image} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm">{c.name}</div>
            <div className="text-xs text-muted-foreground">/{metal.toLowerCase()}/{c.slug}</div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => move(list, i, -1)}>↑</Button>
            <Button variant="ghost" size="icon" onClick={() => move(list, i, 1)}>↓</Button>
            <Button variant="ghost" size="icon" onClick={() => setEditing(c)}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      ))}
      {list.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">No sub-categories yet.</p>
      )}
      <Button variant="outline" className="w-full" onClick={() => handleAddClick(metal)}>
        <Plus className="h-4 w-4 mr-1" /> Add sub-category
      </Button>
    </div>
  );

  return (
    <>
      <PageHeader title="Categories" description="Manage Gold and Silver sub-categories." />

      {categoriesLoading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Loading categories...</div>
      ) : (
        <Tabs defaultValue="gold">
          <TabsList>
            <TabsTrigger value="gold">Gold</TabsTrigger>
            <TabsTrigger value="silver">Silver</TabsTrigger>
          </TabsList>
          <TabsContent value="gold" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Gold sub-categories</CardTitle></CardHeader>
              <CardContent>{render("Gold", gold)}</CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="silver" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Silver sub-categories</CardTitle></CardHeader>
              <CardContent>{render("Silver", silver)}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {editing && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">
              {editing.id ? `Edit ${editing.metal} · ${editing.name}` : `New ${editing.metal} Sub-category`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                placeholder="e.g. Rings"
                value={editing.name ?? ""}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                rows={3}
                placeholder="Shown on the category page for customers"
                value={editing.metaDesc ?? ""}
                onChange={(e) => setEditing({ ...editing, metaDesc: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={handleSaveEdit} disabled={saving}>
                {saving ? "Saving..." : editing.id ? "Save" : "Create"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}