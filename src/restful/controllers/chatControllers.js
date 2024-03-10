/* eslint-disable quotes */
import dotenv from "dotenv";
// import Util from "../../helper/utils";
const admin = require("firebase-admin");
const db = admin.firestore();

dotenv.config();
/**
 * @class ChatController
 * @classdesc ChatController
 */

class ChatController {
  /**
   * @param {Object} req request Object.
   * @param {Object} res response Object.
   * @returns {Object} response Object.
   */

  static async sendMessage(req, res) {
    const { text, senderId, receiverId } = req.body;

    if (!text || !senderId || !receiverId) {
      return res.status(400).json({ error: "Invalid request" });
    }

    await db.collection("messages").add({
      text,
      createdAt: new Date(),
      senderId,
      receiverId,
    });

    res.json({ success: true });
  }

  // Get messages in real-time
  static async ReceiveMessage(req, res) {
    const receiverId = req.params.receiverId;
    const messagesRef = db.collection("messages");
    const query = messagesRef
      .where("receiverId", "==", receiverId)
      .orderBy("createdAt", "asc")
      .limit(25);

    // Set up real-time listener
    const unsubscribe = query.onSnapshot((snapshot) => {
      const messages = snapshot.docs.map((doc) => doc.data());
      res.json(messages);
    });

    req.on("close", () => {
      unsubscribe();
    });
  }
}

export default ChatController;
