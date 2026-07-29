import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title, description, actions,
}: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="font-display text-2xl md:text-3xl tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-success/15 text-success border-success/30",
    Published: "bg-success/15 text-success border-success/30",
    Delivered: "bg-success/15 text-success border-success/30",
    Paid: "bg-success/15 text-success border-success/30",
    Pending: "bg-warning/20 text-warning-foreground border-warning/40",
    Processing: "bg-warning/20 text-warning-foreground border-warning/40",
    Shipped: "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-300",
    "In Transit": "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-300",
    "Out for Delivery": "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-300",
    Booked: "bg-muted text-muted-foreground border-border",
    Draft: "bg-muted text-muted-foreground border-border",
    Scheduled: "bg-muted text-muted-foreground border-border",
    Cancelled: "bg-destructive/15 text-destructive border-destructive/30",
    Refunded: "bg-destructive/15 text-destructive border-destructive/30",
    Returned: "bg-destructive/15 text-destructive border-destructive/30",
    Flagged: "bg-destructive/15 text-destructive border-destructive/30",
    Inactive: "bg-destructive/15 text-destructive border-destructive/30",
    Blocked: "bg-destructive/15 text-destructive border-destructive/30",
    Expired: "bg-muted text-muted-foreground border-border",
    RTO: "bg-destructive/15 text-destructive border-destructive/30",
    COD: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        map[status] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {status}
    </span>
  );
}
