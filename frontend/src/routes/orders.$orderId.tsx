import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/admin/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, FileText, Printer, Package, Ban, ExternalLink } from "lucide-react";
import { adminApi } from "@/lib/adminApi";

export const Route = createFileRoute("/orders/$orderId")({
    head: () => ({ meta: [{ title: "Order Details — NVS Admin" }] }),
    component: AdminOrderDetail,
});

const STAGES = ["Placed", "Confirmed", "Shipped", "Delivered", "Cancelled"];

function inr(n: number) {
    return `₹${(n || 0).toLocaleString("en-IN")}`;
}

function AdminOrderDetail() {
    const { orderId } = useParams({ from: "/orders/$orderId" });
    const nav = useNavigate();

    const [order, setOrder] = useState<any>(null);
    const [tracking, setTracking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        loadOrder();
    }, [orderId]);

    async function loadOrder() {
        setLoading(true);
        try {
            const res = await adminApi.getOrderById(orderId);
            setOrder(res.order);
            setTracking(res.tracking);
        } catch (err: any) {
            toast.error(err.message || "Failed to load order");
        } finally {
            setLoading(false);
        }
    }

    async function handleStatusChange(newStatus: string) {
        try {
            const res = await adminApi.updateOrderStatus(orderId, newStatus);
            setOrder(res.order);
            toast.success(`Status updated to ${newStatus}`);
        } catch (err: any) {
            toast.error(err.message || "Failed to update status");
        }
    }

    async function handleGenerateLabel() {
        setActionLoading("label");
        try {
            const res = await adminApi.generateOrderLabel(orderId);
            setOrder(res.order);
            window.open(res.labelUrl, "_blank");
            toast.success("Label generated");
        } catch (err: any) {
            toast.error(err.message || "Failed to generate label");
        } finally {
            setActionLoading(null);
        }
    }

    async function handleGenerateManifest() {
        setActionLoading("manifest");
        try {
            const res = await adminApi.generateOrderManifest(orderId);
            setOrder(res.order);
            window.open(res.manifestUrl, "_blank");
            toast.success("Manifest generated");
        } catch (err: any) {
            toast.error(err.message || "Failed to generate manifest");
        } finally {
            setActionLoading(null);
        }
    }

    async function handlePrintInvoice() {
        setActionLoading("invoice");
        try {
            const res = await adminApi.printOrderInvoice(orderId);
            setOrder(res.order);
            window.open(res.invoiceUrl, "_blank");
            toast.success("Invoice ready");
        } catch (err: any) {
            toast.error(err.message || "Failed to generate invoice");
        } finally {
            setActionLoading(null);
        }
    }

    async function handleCancel() {
        if (!confirm("Cancel this order? This cannot be undone.")) return;
        setActionLoading("cancel");
        try {
            const res = await adminApi.cancelOrder(orderId);
            setOrder(res.order);
            toast.success("Order cancelled");
        } catch (err: any) {
            toast.error(err.message || "Failed to cancel order");
        } finally {
            setActionLoading(null);
        }
    }

    if (loading) {
        return <div className="py-20 text-center text-muted-foreground">Loading order...</div>;
    }

    if (!order) {
        return <div className="py-20 text-center text-muted-foreground">Order not found.</div>;
    }

    const trackData = tracking?.tracking_data?.shipment_track?.[0];

    return (
        <>
            <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" onClick={() => nav({ to: "/orders" })}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-xl font-semibold flex items-center gap-2">
                        Order {order.id.slice(-8).toUpperCase()}
                        <StatusBadge status={order.status} />
                        <StatusBadge status={order.paymentStatus} />
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Placed {new Date(order.createdAt).toLocaleString("en-IN")}
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                {/* Left: Order info */}
                <div className="md:col-span-2 space-y-4">
                    <Card>
                        <CardHeader><CardTitle className="text-sm">Items</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {order.items.map((i: any) => (
                                <div key={i.id} className="flex justify-between text-sm border-b pb-2 last:border-0">
                                    <div>
                                        <p className="font-medium">{i.name}</p>
                                        <p className="text-xs text-muted-foreground">SKU: {i.sku} · Qty: {i.qty}</p>
                                    </div>
                                    <span className="tabular-nums">{inr(i.sellingPrice * i.qty)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between font-semibold pt-2">
                                <span>Total</span>
                                <span>{inr(order.total)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-sm">Customer & Shipping</CardTitle></CardHeader>
                        <CardContent className="text-sm space-y-1">
                            <p className="font-medium">
                                {order.customerName} {order.customerLastName !== "NA" ? order.customerLastName : ""}
                            </p>
                            <p className="text-muted-foreground">{order.customerEmail}</p>
                            <p className="text-muted-foreground">{order.customerPhone}</p>
                            <p className="pt-2">{order.address}</p>
                            <p>{order.city}, {order.state} — {order.pincode}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-sm">Shiprocket Tracking</CardTitle></CardHeader>
                        <CardContent className="text-sm space-y-2">
                            {!order.srAwbCode ? (
                                <p className="text-muted-foreground">AWB not yet assigned.</p>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground">AWB</p>
                                            <p>{order.srAwbCode}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Courier</p>
                                            <p>{order.srCourierName || "—"}</p>
                                        </div>
                                        {trackData?.current_status && (
                                            <div>
                                                <p className="text-xs text-muted-foreground">Current Status</p>
                                                <p>{trackData.current_status}</p>
                                            </div>
                                        )}
                                        {trackData?.edd && (
                                            <div>
                                                <p className="text-xs text-muted-foreground">EDD</p>
                                                <p>{new Date(trackData.edd).toLocaleDateString("en-IN")}</p>
                                            </div>
                                        )}
                                    </div>
                                    {tracking?.tracking_data?.track_url && (
                                        <a href={tracking.tracking_data.track_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-gold hover:underline pt-1"
                                        >
                                            Track on courier site <ExternalLink className="h-3 w-3" />
                                        </a>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Actions */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle className="text-sm">Update Status</CardTitle></CardHeader>
                        <CardContent>
                            <Select value={order.status} onValueChange={handleStatusChange}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-sm">Shipping Documents</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                disabled={!order.srShipmentId || order.status === "Cancelled" || actionLoading === "label"}
                                onClick={handleGenerateLabel}
                            >
                                <Printer className="h-4 w-4 mr-2" />
                                {order.labelUrl ? "Re-download Label" : "Generate Label"}
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                disabled={!order.srShipmentId || order.status === "Cancelled" || actionLoading === "manifest"}
                                onClick={handleGenerateManifest}
                            >
                                <Package className="h-4 w-4 mr-2" />
                                {order.manifestUrl ? "Re-download Manifest" : "Generate Manifest"}
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                disabled={!order.srOrderId || actionLoading === "invoice"}
                                onClick={handlePrintInvoice}
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                {order.invoiceUrl ? "Re-download Invoice" : "Generate Invoice"}
                            </Button>

                            {(order.labelUrl || order.manifestUrl || order.invoiceUrl) && (
                                <div className="pt-2 border-t space-y-1 text-xs">
                                    {order.labelUrl && (
                                        <a href={order.labelUrl} target="_blank" rel="noreferrer" className="block text-gold hover:underline">
                                            View last label PDF →
                                        </a>
                                    )}
                                    {order.manifestUrl && (
                                        <a href={order.manifestUrl} target="_blank" rel="noreferrer" className="block text-gold hover:underline">
                                            View last manifest PDF →
                                        </a>
                                    )}
                                    {order.invoiceUrl && (
                                        <a href={order.invoiceUrl} target="_blank" rel="noreferrer" className="block text-gold hover:underline">
                                            View last invoice PDF →
                                        </a>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <Button
                                variant="destructive"
                                className="w-full"
                                disabled={order.status === "Cancelled" || actionLoading === "cancel"}
                                onClick={handleCancel}
                            >
                                <Ban className="h-4 w-4 mr-2" />
                                Cancel Order
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}