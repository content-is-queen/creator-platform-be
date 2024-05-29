const express = require('express');
const { createSubscription, createCustomer,createPaymentMethod, createCheckoutSession } = require('../controllers/paymentController');

const router = express.Router();

router.post('/create-payment-intent', createSubscription);
router.post('/create-customer', createCustomer);

router.post('/create-payment-method', createPaymentMethod);
router.post('/create-checkout-session', createCheckoutSession);

module.exports.paymentsRouter = router;
