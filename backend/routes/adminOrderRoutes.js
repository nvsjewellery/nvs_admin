const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/adminAuthMiddleware');
const {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  generateOrderManifest,
  generateOrderLabel,
  printOrderInvoice,
  cancelOrderById,
} = require('../controllers/adminOrderController');

router.use(protectAdmin);

router.get('/', getAllOrders);
router.get('/:orderId', getOrderById);
router.patch('/:orderId/status', updateOrderStatus);
router.post('/:orderId/generate-manifest', generateOrderManifest);
router.post('/:orderId/generate-label', generateOrderLabel);
router.post('/:orderId/print-invoice', printOrderInvoice);
router.post('/:orderId/cancel', cancelOrderById);

module.exports = router;