import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, StatusBadge } from "@/components/admin/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Reply, Trash2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { REVIEWS, type Review } from "@/lib/mock";

export const Route = createFileRoute("/_admin/reviews")({
  head: () => ({ meta: [{ title: "Reviews — NVS Admin" }] }),
  component: ReviewsPage,
});

function ReviewsPage() {
  const [list, setList] = useState<Review[]>(REVIEWS);
  const [rating, setRating] = useState("all");
  const [status, setStatus] = useState("all");
  const [reply, setReply] = useState<{ id: string; text: string } | null>(null);

  const filtered = list.filter((r) =>
    (rating === "all" || String(r.rating) === rating) &&
    (status === "all" || r.status === status),
  );

  return (
    <>
      <PageHeader title="Reviews" description="Moderate product reviews and reply as the store." />

      <Card className="mb-4"><CardContent className="p-4 flex gap-3 flex-wrap">
        <Select value={rating} onValueChange={setRating}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Rating" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ratings</SelectItem>
            {[5, 4, 3, 2, 1].map((n) => <SelectItem key={n} value={String(n)}>{n} stars</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Published">Published</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Flagged">Flagged</SelectItem>
          </SelectContent>
        </Select>
      </CardContent></Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Review</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.product}</TableCell>
                  <TableCell>{r.customer}</TableCell>
                  <TableCell>
                    <div className="flex text-gold">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-current" : "opacity-30"}`} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-sm">
                    <div className="text-sm truncate">{r.text}</div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.date}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {r.status !== "Published" && (
                        <Button size="sm" variant="outline" onClick={() => {
                          setList(list.map((x) => x.id === r.id ? { ...x, status: "Published" } : x));
                          toast.success("Review approved");
                        }}>Approve</Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => setReply({ id: r.id, text: "" })}><Reply className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { setList(list.filter((x) => x.id !== r.id)); toast.success("Review deleted"); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {reply && (
            <div className="p-4 border-t bg-muted/30 flex gap-2">
              <Input placeholder="Reply as NVS Jewellery…" value={reply.text} onChange={(e) => setReply({ ...reply, text: e.target.value })} />
              <Button variant="outline" onClick={() => setReply(null)}>Cancel</Button>
              <Button className="bg-gold text-gold-foreground hover:bg-gold/90" onClick={() => { toast.success("Reply posted"); setReply(null); }}>Post</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
