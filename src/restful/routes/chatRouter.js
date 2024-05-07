const { Router } = require("express");
const { ChatController } = require("../controllers/chatController.js");
const { protect } = require("../../middleware/index.js");

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

router.post("/", protect, ChatController.sendMessage);
router.get("/users", protect, ChatController.getUsers);
router.get("/:receiverId", protect, ChatController.receiveMessage);
router.get("/profiles", protect, ChatController.getUserProfiles);

module.exports.chatRouter = router;
