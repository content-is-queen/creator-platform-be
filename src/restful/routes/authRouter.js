const { Router } = require("express");
const { AuthController } = require("../controllers/authController");
const { protect } = require("../../middleware");

const router = Router();

const rateLimit = require('express-rate-limit');

// Define rate limiting options
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Max 5 requests per minute
  message: "Too many requests from this IP, please try again later."
});

// Apply rate limiting middleware to all routes in the applications router
router.use(limiter);

router.get("/user", protect, AuthController.getUser);
router.put("/user", protect, AuthController.updateUser);

router.get("/users", AuthController.getAllUsers);
router.post("/signup", AuthController.signup);
router.post("/verify", AuthController.verifyOtp);
router.post("/reset", AuthController.resetUserPassword);
router.post("/username", protect, AuthController.createUsername);
router.get("/user/:user_id", AuthController.getPublicUser);

module.exports.authRouter = router;
