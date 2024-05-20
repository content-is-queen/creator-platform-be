const { Router } = require("express");
const { ChatController } = require("../controllers/chatController.js");
const { protect } = require("../../middleware/index.js");

const router = Router();

const rateLimit = require("express-rate-limit");

router.post("/", protect, ChatController.sendMessage);
router.get("/users", protect, ChatController.getUsers);
router.get("/:receiverId", protect, ChatController.receiveMessage);
router.get("/profiles", protect, ChatController.getUserProfiles);

module.exports.chatRouter = router;
