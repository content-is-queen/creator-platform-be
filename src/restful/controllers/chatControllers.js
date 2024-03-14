/* eslint-disable quotes */
import dotenv from "dotenv";
// import Util from "../../helper/utils";
const admin = require("firebase-admin");

dotenv.config();
/**
 * @class ChatController
 * @classdesc ChatController
 */

async function listAllUsers() {
  const userList = [];
  let nextPageToken;

  do {
    const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);

    listUsersResult.users.forEach((userRecord) => {
      userList.push({
        uid: userRecord.uid,
        email: userRecord.email,
        // Add more user properties as needed
      });
    });

    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);

  return userList;
}

class ChatController {
  /**
   * @param {Object} req request Object.
   * @param {Object} res response Object.
   * @returns {Object} response Object.
   */

  static async sendMessage(req, res) {
    const db = admin.firestore();
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
    const db = admin.firestore();
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

  static async users(req, res) {
    try {
      const userList = await listAllUsers();
      res.json(userList);
    } catch (error) {
      console.error("Error listing users:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}

export default ChatController;
