const { Router } = require("express");

import { router as authRouter } from "./authRouters";
import { router as messagesRouter } from "./chatRouters";
import { router as opportunitiesRouter } from "./opportunitiesRouters";
import { router as applicationsRouter } from "./applicationsRouters";

const API_VERSION = process.env.API_VERSION || "v1";
const router = Router();

router.use(`${url}/auth`, authRouter);
router.use(`${url}/messages`, messagesRouter);
router.use(`${url}/opportunities`, opportunitiesRouter);
router.use(`${url}/applications`, applicationsRouter);

router.all(`/${API_VERSION}/`, (req, res) => {
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
