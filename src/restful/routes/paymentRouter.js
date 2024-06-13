const express = require("express");
const {
  createCheckoutSession,
  subscribeUser,
  cancelSubscription,
  getUserPaymentInfo,
  getSubscriptionInfo,
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/create-checkout-session", createCheckoutSession);
router.post("/subscribe", subscribeUser);
router.post("/cancel-subscription", cancelSubscription);
router.get("/info", getUserPaymentInfo);
router.get("/subscription", getSubscriptionInfo);

module.exports.paymentsRouter = router;
