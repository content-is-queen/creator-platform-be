const express = require("express");
const {
  createCheckoutSession,
  subscribeUser,
  cancelSubscription, getUserPaymentInfo, getSubscriptionInfo
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/create-checkout-session", createCheckoutSession);
router.post("/subscribe", subscribeUser);
router.post("/cancel-subscription", cancelSubscription);
router.get("/get-user-payment-info", getUserPaymentInfo);
router.get("/get-subscription-info", getSubscriptionInfo);

module.exports.paymentsRouter = router;
