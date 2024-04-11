const { Router } = require("express");

const { router: authRouter } = require("./authRouters");
const { router: messagesRouter } = require("./chatRouters");
const { router: opportunitiesRouter } = require("./opportunitiesRouters");

const API_VERSION = process.env.API_VERSION || "v1";
const url = `/api/${API_VERSION}`;
const router = Router();

router.use(`${url}/auth`, authRouter);
router.use(`${url}/messages`, messagesRouter);
router.use(`${url}/opportunities`, opportunitiesRouter);

router.all(`${url}/`, (req, res) => {
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
