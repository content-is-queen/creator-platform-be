const { Router } = require("express");

const { authRouter } = require("./authRouter");
const { chatRouter } = require("./chatRouter");
const { opportunitiesRouter } = require("./opportunitiesRouter");

const API_VERSION = process.env.API_VERSION || "v1";
const router = Router();

router.use(`${API_VERSION}/auth`, authRouter);
router.use(`${API_VERSION}/messages`, chatRouter);
router.use(`${API_VERSION}/opportunities`, opportunitiesRouter);

router.all(`${API_VERSION}/`, (req, res) => {
  return res
    .status(200)
    .json({ message: "Welcome to Creator Platform backend!" });
});
router.use("*", (req, res) => {
  res.status(404).json({
    status: 404,
    message: "This endpoint is not exist",
  });
});

module.exports = router;
