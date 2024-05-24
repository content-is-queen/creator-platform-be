const express = require('express');
const { createSubscription, createCustomer,createPaymentMethod } = require('../controllers/paymentController');

const router = express.Router();

router.post('/create-payment-intent', createSubscription);
router.post('/create-customer', createCustomer);

router.post('/create-payment-method', createPaymentMethod);

module.exports.paymentsRouter = router;
