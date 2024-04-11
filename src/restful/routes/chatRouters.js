const { Router } = require("express");
const ChatController = require("../controllers/chatControllers");
const protect = require("../../middlewares");

const router = Router();

router.post("/", protect, ChatController.sendMessage);
router.get("/users", protect, ChatController.users);
router.get("/profiles", protect, ChatController.usersProfiles);
router.get("/:receiverId", protect, ChatController.ReceiveMessage);

exports.router = router;
