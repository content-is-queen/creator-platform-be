const { Router } = require("express");

const { authRouter } = require("./authRouter");
const { chatRouter } = require("./chatRouter");
const { opportunitiesRouter } = require("./opportunitiesRouter");
const { applicationsRouter } = require("./applicationsRouter");
const { contractRouter } = require("./contractRouter");
const { adminRouter } = require("./adminRouter");
const { paymentsRouter } = require("./paymentRouter");
const rateLimit = require("express-rate-limit");

// Define rate limiting options
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // Max 50 requests per minute
  message: "Too many requests from this IP, please try again later.",
});

const API_VERSION = process.env.API_VERSION || "v1";
const router = Router();
router.use(limiter);

router.use(`/${API_VERSION}/auth`, authRouter);
router.use(`/${API_VERSION}/messages`, chatRouter);
router.use(`/${API_VERSION}/opportunities`, opportunitiesRouter);
router.use(`/${API_VERSION}/applications`, applicationsRouter);
router.use(`/${API_VERSION}/contracts`, contractRouter);
router.use(`/${API_VERSION}/admin`, adminRouter);
router.use(`/${API_VERSION}/payments`, paymentsRouter);

router.all(`/${API_VERSION}/`, (req, res) => {
  return res
    .status(200)
    .json({ message: "Welcome to Creator Platform backend!" });
});
router.use("*", (req, res) => {
  res.status(404).json({
    status: 404,
    message: "This endpoint does not exist.",
  });
});

module.exports = router;
