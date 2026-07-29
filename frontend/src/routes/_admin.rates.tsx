import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdmin } from "@/lib/admin-store";
import { inr, type GoldPurity, type SilverPurity } from "@/lib/mock";
import { Wifi } from "lucide-react";

export const Route = createFileRoute("/_admin/rates")({
  head: () => ({ meta: [{ title: "Live Metal Rates — NVS Admin" }] }),
  component: RatesPage,
});

function RatesPage() {
  const { rates, ratesLastUpdated } = useAdmin();

  return (
    <>
      <PageHeader
        title="Live Metal Rates"
        description="Rates stream in automatically from the connected market feed. All product pricing recalculates in real time."
        actions={
          <Badge variant="outline" className="gap-1.5 border-success/40 text-success bg-success/10">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <Wifi className="h-3 w-3" /> Live feed connected
          </Badge>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-gold" /> Gold Rates
              <span className="text-xs font-normal text-muted-foreground ml-auto">₹ / gram</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {(Object.keys(rates.gold) as GoldPurity[]).map((k) => (
              <div key={k} className="rounded-md border bg-secondary/40 p-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{k}</div>
                <div className="font-display text-xl mt-1">{inr(rates.gold[k])}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground" /> Silver Rates
              <span className="text-xs font-normal text-muted-foreground ml-auto">₹ / gram</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {(Object.keys(rates.silver) as SilverPurity[]).map((k) => (
              <div key={k} className="rounded-md border bg-secondary/40 p-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{k}</div>
                <div className="font-display text-xl mt-1">{inr(rates.silver[k])}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 text-xs text-muted-foreground">
        Last synced: <span className="font-medium text-foreground">{ratesLastUpdated}</span> · Auto-refreshes every 60 seconds
      </div>
    </>
  );
}
