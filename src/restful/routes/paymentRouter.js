const express = require("express");
const {
  createCheckoutSession,
  subscribeUser,
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/create-checkout-session", createCheckoutSession);
router.post("/subscribe", subscribeUser);

module.exports.paymentsRouter = router;
