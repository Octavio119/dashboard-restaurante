const router     = require('express').Router();
const requireAuth = require('../middleware/auth');
const requireTenant = require('../middleware/requireTenant');
const { createOrder, captureOrder, handleWebhook } = require('../controllers/payment.controller');

// Webhook does NOT need auth (called by PayPal directly)
// Raw body parsing is handled in app.js before this router
router.post('/webhook', handleWebhook);

// Protected payment endpoints
router.use(requireAuth);
router.use(requireTenant);

router.post('/paypal/create-order',  createOrder);
router.post('/paypal/capture-order', captureOrder);

module.exports = router;
