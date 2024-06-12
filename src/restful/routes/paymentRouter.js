const express = require("express");
const {
  createCheckoutSession,
  subscribeUser,
  cancelSubscription,
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/create-checkout-session", createCheckoutSession);
router.post("/subscribe", subscribeUser);
router.post("/cancel-subscription", cancelSubscription);

module.exports.paymentsRouter = router;
