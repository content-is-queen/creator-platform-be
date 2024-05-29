const { Router } = require("express");
const { ChatController } = require("../controllers/chatController");

const router = Router();

router.get("/users", ChatController.getUsers);
router.get("/messages/:receiverId", ChatController.receiveMessages);
router.get("/profiles", ChatController.getUserProfiles);
router.post("/create-room", ChatController.createRoom);
router.post("/add-user-to-room", ChatController.addUserToRoom); 
router.get("/rooms/:roomId", ChatController.getRoomInfo);
router.get("/user-rooms/:userId", ChatController.getUserRooms);

module.exports.chatRouter = router;
