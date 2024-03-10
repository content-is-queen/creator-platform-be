/* eslint-disable prettier/prettier */
import { Router } from "express";
import protect from "../../middlewares";
import ChatController from "../controllers/chatControllers";

const router = Router();

router.post("/",protect, ChatController.sendMessage);
router.get("/:receiverId",protect, ChatController.ReceiveMessage);

module.exports = { router };
