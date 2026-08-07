const prisma = require('../lib/prisma');
const {
    trackOrder,
    generateManifest,
    printManifest,
    generateLabel,
    printInvoice,
    cancelOrder,
} = require('../services/shiprocketService');

// GET /api/admin/orders — list all orders, newest first
async function getAllOrders(req, res) {
    try {
        const { status, search } = req.query;

        const where = {};
        if (status && status !== 'all') where.status = status;
        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
                { customerEmail: { contains: search, mode: 'insensitive' } },
                { srAwbCode: { contains: search, mode: 'insensitive' } },
            ];
        }

        const orders = await prisma.order.findMany({
            where,
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, orders });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// GET /api/admin/orders/:orderId — full detail + live tracking
async function getOrderById(req, res) {
    try {
        const { orderId } = req.params;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        let tracking = null;
        if (order.srAwbCode) {
            try {
                tracking = await trackOrder(order.srAwbCode);
            } catch (err) {
                console.error("Tracking fetch failed:", err.response?.data || err.message);
            }
        }

        res.json({ success: true, order, tracking });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// PATCH /api/admin/orders/:orderId/status — manual status override
async function updateOrderStatus(req, res) {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const validStatuses = ["Placed", "Confirmed", "Shipped", "Delivered", "Cancelled"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const order = await prisma.order.update({
            where: { id: orderId },
            data: { status },
            include: { items: true },
        });

        res.json({ success: true, order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
}

// POST /api/admin/orders/:orderId/generate-manifest
async function generateOrderManifest(req, res) {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });

    if (order.status === "Cancelled") {
      return res.status(400).json({ success: false, message: "Cannot generate manifest for a cancelled order" });
    }
    if (!order?.srShipmentId) {
      return res.status(400).json({ success: false, message: "No shipment ID on this order" });
    }

    await generateManifest(order.srShipmentId);
    const printResult = await printManifest([order.srOrderId]);

    if (!printResult.manifest_url) {
      return res.status(400).json({ success: false, message: "Shiprocket did not return a manifest URL" });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { manifestUrl: printResult.manifest_url },
      include: { items: true },
    });

    res.json({ success: true, manifestUrl: printResult.manifest_url, order: updated });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ success: false, message: err.response?.data?.message || err.message });
  }
}

// POST /api/admin/orders/:orderId/generate-label
async function generateOrderLabel(req, res) {
    try {
        const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
        if (!order?.srShipmentId) {
            return res.status(400).json({ success: false, message: "No shipment ID on this order" });
        }

        const result = await generateLabel(order.srShipmentId);

        // generateOrderLabel
        const updated = await prisma.order.update({
            where: { id: order.id },
            data: { labelUrl: result.label_url },
            include: { items: true },   // add this
        });

        res.json({ success: true, labelUrl: result.label_url, order: updated });
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({ success: false, message: err.response?.data?.message || err.message });
    }
}

// POST /api/admin/orders/:orderId/print-invoice
async function printOrderInvoice(req, res) {
    try {
        const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
        if (!order?.srOrderId) {
            return res.status(400).json({ success: false, message: "No Shiprocket order on this order" });
        }

        const result = await printInvoice([order.srOrderId]);

        // printOrderInvoice
        const updated = await prisma.order.update({
            where: { id: order.id },
            data: { invoiceUrl: result.invoice_url },
            include: { items: true },   // add this
        });
        res.json({ success: true, invoiceUrl: result.invoice_url, order: updated });
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({ success: false, message: err.response?.data?.message || err.message });
    }
}

// POST /api/admin/orders/:orderId/cancel
async function cancelOrderById(req, res) {
    try {
        const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
        if (!order?.srOrderId) {
            return res.status(400).json({ success: false, message: "No Shiprocket order to cancel" });
        }

        await cancelOrder([order.srOrderId]);

        const updated = await prisma.order.update({
            where: { id: order.id },
            data: { status: "Cancelled" },
            include: { items: true },
        });

        res.json({ success: true, order: updated });
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({ success: false, message: err.response?.data?.message || err.message });
    }
}

module.exports = {
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    generateOrderManifest,
    generateOrderLabel,
    printOrderInvoice,
    cancelOrderById,
};