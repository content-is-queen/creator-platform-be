const express = require("express");
const {
  createCheckoutSession,
  subscribeUser,
  cancelSubscription,
  getUserPaymentInfo,
  getSubscriptionInfo,
} = require("../controllers/paymentController");
const { protect } = require("../../middleware");

const router = express.Router();

router.get("/create-checkout-session", protect, createCheckoutSession);
router.post("/subscribe", protect, subscribeUser);
router.post("/cancel-subscription", cancelSubscription);

router.get("/info", protect, getUserPaymentInfo);
router.get("/subscription", protect, getSubscriptionInfo);

module.exports.paymentsRouter = router;
