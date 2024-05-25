const { Router } = require("express");
const { ChatController } = require("../controllers/chatController");
const { protect } = require("../../middleware/index");

const router = Router();
const rateLimit = require("express-rate-limit");

// Rate limit middleware
const sendMessageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: "Too many requests, please try again later." },
});

router.post("/send", sendMessageLimiter, ChatController.sendMessage);
router.get("/users", ChatController.getUsers);
router.get("/messages/:receiverId", ChatController.receiveMessages);
router.get("/profiles", ChatController.getUserProfiles);
router.post("/create-room", ChatController.createRoom); // Endpoint for creating a room
router.post("/add-user-to-room", ChatController.addUserToRoom); // New endpoint for adding users to a room
router.get("/:roomId/allmessages", ChatController.getMessages);
router.get("/rooms/:roomId", ChatController.getRoomInfo);
router.get("/user-rooms/:userId", ChatController.getUserRooms);

module.exports.chatRouter = router;
