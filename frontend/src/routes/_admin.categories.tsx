import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

import { PageHeader } from "@/components/admin/shared";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAdmin } from "@/lib/admin-store";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/_admin/categories")({
  head: () => ({
    meta: [{ title: "Categories — NVS Admin" }],
  }),
  component: CategoriesPage,
});

type Cat = {
  id: string;
  metal: "Gold" | "Silver";
  name: string;
  slug: string;
  metaTitle: string;
  metaDesc: string;
  image: string;
  sortOrder: number;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function CategoriesPage() {
  const {
    categories,
    categoriesLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
  } = useAdmin();

  const [editing, setEditing] =
    useState<Partial<Cat> | null>(null);

  const [saving, setSaving] = useState(false);

  const gold = useMemo(
    () =>
      categories.filter(
        (c) => c.metal === "Gold"
      ),
    [categories]
  );

  const silver = useMemo(
    () =>
      categories.filter(
        (c) => c.metal === "Silver"
      ),
    [categories]
  );

  // ============================================================
  // REORDER
  // ============================================================

  async function move(
    list: Cat[],
    idx: number,
    dir: -1 | 1
  ) {
    const target = idx + dir;

    if (
      target < 0 ||
      target >= list.length
    ) {
      return;
    }

    const copy = [...list];

    [copy[idx], copy[target]] = [
      copy[target],
      copy[idx],
    ];

    try {
      await reorderCategories(
        copy.map((c) => c.id)
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Reorder failed"
      );
    }
  }

  // ============================================================
  // DELETE
  // ============================================================

  async function handleDelete(
    id: string
  ) {
    try {
      await deleteCategory(id);

      toast.success(
        "Sub-category deleted"
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Delete failed"
      );
    }
  }

  // ============================================================
  // ADD
  // ============================================================

  function handleAddClick(
    metal: "Gold" | "Silver"
  ) {
    setEditing({
      metal,
      name: "",
      metaDesc: "",
    });
  }

  // ============================================================
  // SAVE
  // ============================================================

  async function handleSaveEdit() {
    if (!editing) {
      return;
    }

    if (!editing.name?.trim()) {
      toast.error(
        "Name is required"
      );
      return;
    }

    if (!editing.metal) {
      toast.error(
        "Metal type is required"
      );
      return;
    }

    setSaving(true);

    try {
      const slug = slugify(
        editing.name
      );

      if (editing.id) {
        await updateCategory(
          editing.id,
          {
            name: editing.name,
            slug,
            metaTitle: "",
            metaDesc:
              editing.metaDesc ?? "",
            image:
              editing.image ?? "",
          }
        );

        toast.success(
          "Category updated"
        );
      } else {
        await createCategory({
          metal: editing.metal,
          name: editing.name,
          slug,
          metaTitle: "",
          metaDesc:
            editing.metaDesc ?? "",
          image: "",
        });

        toast.success(
          "Sub-category created"
        );
      }

      setEditing(null);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Save failed"
      );
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // EXPORT EXCEL
  // ============================================================

  function exportExcel() {
    if (categories.length === 0) {
      toast.error(
        "No categories available to export"
      );
      return;
    }

    const rows = categories.map(
      (category) => ({
        "Category ID":
          category.id,

        Metal:
          category.metal,

        Name:
          category.name,

        Slug:
          category.slug,

        Description:
          category.metaDesc || "",

        "Sort Order":
          category.sortOrder,
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
      "Categories"
    );

    XLSX.writeFile(
      workbook,
      `categories-report-${Date.now()}.xlsx`
    );

    toast.success(
      "Categories exported to Excel"
    );
  }

  // ============================================================
  // EXPORT PDF
  // ============================================================

  function exportPdf() {
    if (categories.length === 0) {
      toast.error(
        "No categories available to export"
      );
      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
    });

    doc.setFontSize(14);

    doc.text(
      "NVS Jewellery — Categories Report",
      14,
      15
    );

    doc.setFontSize(9);

    doc.text(
      `Generated: ${new Date().toLocaleString(
        "en-IN"
      )} · ${categories.length} categories`,
      14,
      21
    );

    autoTable(doc, {
      startY: 26,

      head: [
        [
          "Metal",
          "Category",
          "Slug",
          "Description",
          "Sort Order",
        ],
      ],

      body: categories.map(
        (category) => [
          category.metal,
          category.name,
          category.slug,
          category.metaDesc || "—",
          category.sortOrder,
        ]
      ),

      styles: {
        fontSize: 8,
      },

      headStyles: {
        fillColor: [184, 134, 11],
      },
    });

    doc.save(
      `categories-report-${Date.now()}.pdf`
    );

    toast.success(
      "Categories exported to PDF"
    );
  }

  // ============================================================
  // CATEGORY LIST RENDER
  // ============================================================

  const render = (
    metal: "Gold" | "Silver",
    list: Cat[]
  ) => (
    <div className="space-y-3">

      {list.map((c, i) => (
        <div
          key={c.id}
          className="flex items-center justify-between rounded-lg border p-4"
        >
          {/* CATEGORY INFO */}
          {/* IMAGE PLACEHOLDER REMOVED */}

          <div className="min-w-0">
            <div className="font-medium">
              {c.name}
            </div>

            <div className="text-xs text-muted-foreground mt-1">
              /{metal.toLowerCase()}/
              {c.slug}
            </div>

            {c.metaDesc && (
              <div className="text-xs text-muted-foreground mt-2 max-w-xl">
                {c.metaDesc}
              </div>
            )}
          </div>

          {/* ACTIONS */}

          <div className="flex items-center gap-1 shrink-0 ml-4">

            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                move(list, i, -1)
              }
              title="Move up"
            >
              ↑
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                move(list, i, 1)
              }
              title="Move down"
            >
              ↓
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setEditing(c)
              }
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                handleDelete(c.id)
              }
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

          </div>
        </div>
      ))}

      {/* EMPTY STATE */}

      {list.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No sub-categories yet.
        </div>
      )}

      {/* ADD */}

      <Button
        variant="outline"
        className="w-full"
        onClick={() =>
          handleAddClick(metal)
        }
      >
        <Plus className="h-4 w-4 mr-1" />
        Add sub-category
      </Button>

    </div>
  );

  return (
    <>
      {/* HEADER */}

      <PageHeader
        title="Categories"
        description={`${categories.length} sub-categories across Gold and Silver.`}
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
                onClick={exportExcel}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={exportPdf}
              >
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* CATEGORY TABS */}

      {categoriesLoading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Loading categories...
        </div>
      ) : (
        <Tabs defaultValue="gold">

          <TabsList>
            <TabsTrigger value="gold">
              Gold
            </TabsTrigger>

            <TabsTrigger value="silver">
              Silver
            </TabsTrigger>
          </TabsList>

          {/* GOLD */}

          <TabsContent
            value="gold"
            className="mt-4"
          >
            <Card>

              <CardHeader>
                <CardTitle className="text-base">
                  Gold sub-categories
                </CardTitle>
              </CardHeader>

              <CardContent>
                {render(
                  "Gold",
                  gold
                )}
              </CardContent>

            </Card>
          </TabsContent>

          {/* SILVER */}

          <TabsContent
            value="silver"
            className="mt-4"
          >
            <Card>

              <CardHeader>
                <CardTitle className="text-base">
                  Silver sub-categories
                </CardTitle>
              </CardHeader>

              <CardContent>
                {render(
                  "Silver",
                  silver
                )}
              </CardContent>

            </Card>
          </TabsContent>

        </Tabs>
      )}

      {/* EDIT / CREATE */}

      {editing && (
        <Card className="mt-6">

          <CardHeader>
            <CardTitle className="text-base">

              {editing.id
                ? `Edit ${editing.metal} · ${editing.name}`
                : `New ${editing.metal} Sub-category`}

            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* NAME */}

            <div>
              <Label>
                Name
              </Label>

              <Input
                placeholder="e.g. Rings"
                value={
                  editing.name ?? ""
                }
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    name:
                      e.target.value,
                  })
                }
              />
            </div>

            {/* DESCRIPTION */}

            <div>
              <Label>
                Description
              </Label>

              <Textarea
                rows={3}
                placeholder="Shown on the category page for customers"
                value={
                  editing.metaDesc ??
                  ""
                }
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    metaDesc:
                      e.target.value,
                  })
                }
              />
            </div>

            {/* ACTIONS */}

            <div className="flex justify-end gap-2">

              <Button
                variant="outline"
                onClick={() =>
                  setEditing(null)
                }
              >
                Cancel
              </Button>

              <Button
                className="bg-gold text-gold-foreground hover:bg-gold/90"
                onClick={
                  handleSaveEdit
                }
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editing.id
                    ? "Save"
                    : "Create"}
              </Button>

            </div>

          </CardContent>
        </Card>
      )}
    </>
  );
}