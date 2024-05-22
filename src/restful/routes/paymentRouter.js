const express = require('express');
const { createSubscription } = require('../controllers/paymentController');

const router = express.Router();

router.post('/create-payment-intent', createSubscription);

module.exports.paymentsRouter = router;
