const prisma = require('../lib/prisma');
const { createOrder, assignAwb } = require('../services/shiprocketService');

// GET orders that are paid/placed but not yet pushed to Shiprocket
async function getPendingShipments(req, res) {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: 'Placed',
        srOrderId: null,
      },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST — admin confirms package dimensions/weight and pushes the order to Shiprocket
// Dimensions/weight are used only for this API call — not persisted on the order.
async function confirmAndShipOrder(req, res) {
  try {
    const { orderId } = req.params;
    const { length, breadth, height, weight } = req.body;

    if (!length || !breadth || !height || !weight) {
      return res.status(400).json({
        success: false,
        message: 'length, breadth, height, and weight are all required',
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.srOrderId) {
      return res.status(400).json({ success: false, message: 'Order already pushed to Shiprocket' });
    }

    // 1. Create the Shiprocket order
    const shiprocketData = await createOrder({
      order_id: order.id,
      order_date: order.createdAt.toISOString().slice(0, 16).replace('T', ' '),
      pickup_location: 'Primary',
      billing_customer_name: order.customerName,
      billing_last_name: order.customerLastName,
      billing_address: order.address,
      billing_city: order.city,
      billing_pincode: order.pincode,
      billing_state: order.state,
      billing_country: 'India',
      billing_email: order.customerEmail,
      billing_phone: order.customerPhone,
      shipping_is_billing: true,
      order_items: order.items.map(i => ({
        name: i.name,
        sku: i.sku,
        units: i.qty,
        selling_price: i.sellingPrice,
      })),
      payment_method: 'Prepaid',
      sub_total: order.subTotal,
      length: Number(length),
      breadth: Number(breadth),
      height: Number(height),
      weight: Number(weight),
    });

    // 2. Assign AWB
    let awbData = null;
    try {
      awbData = await assignAwb(shiprocketData.shipment_id);
     console.log('AWB assign response:', JSON.stringify(awbData, null, 2));

    } catch (awbErr) {
      console.error('AWB assignment failed:', awbErr.response?.data || awbErr.message);
      // SR order exists even if AWB assignment fails — save what we have and let admin retry AWB separately
    }

    // 3. Update order with Shiprocket details only (no dimensions stored)
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        srOrderId: String(shiprocketData.order_id),
        srShipmentId: String(shiprocketData.shipment_id),
        srAwbCode: awbData?.response?.data?.awb_code || null,
        srCourierName: awbData?.response?.data?.courier_name || null,
        status: 'Confirmed',
      },
      include: { items: true },
    });

    res.json({ success: true, order: updatedOrder, shiprocket: shiprocketData, awb: awbData });
  } catch (err) {
    console.error('Shiprocket confirm failed:', err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: err.response?.data?.message || err.message,
    });
  }
}

module.exports = { getPendingShipments, confirmAndShipOrder };