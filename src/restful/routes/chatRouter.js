const { Router } = require("express");
const { ChatController } = require("../controllers/chatController.js");
const { protect } = require("../../middlewares/index.js");

const router = Router();

router.post("/", protect, ChatController.sendMessage);
router.get("/users", protect, ChatController.users);
router.get("/profiles", protect, ChatController.usersProfiles);
router.get("/:receiverId", protect, ChatController.ReceiveMessage);

module.exports.chatRouter = router;
