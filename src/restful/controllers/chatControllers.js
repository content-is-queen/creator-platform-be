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
    const { message, sender, receiver } = req.body;
    if (!message || !sender || !receiver) {
      return res.status(400).json({ error: "Invalid request" });
    }
    const roomName = `${sender}_${receiver}`;
    const roomRef = db.collection("rooms").doc(roomName);
    const messageData = {
      message,
      createdAt: new Date(),
      sender,
      receiver,
    };
    const batch = db.batch();
    batch.set(roomRef, { id: roomName, name: roomName }, { merge: true });

    const messagesRef = roomRef.collection("messages").doc();
    batch.set(messagesRef, messageData);
    await batch.commit();
    res.json({ success: true });
  }

  // Get messages in real-time
  static async ReceiveMessage(req, res) {
    const db = admin.firestore();
    const receiverId = req.params.receiverId;
    const roomRef = db.collection("rooms").doc(receiverId);
    const messagesRef = roomRef.collection("messages");

    messagesRef.onSnapshot(
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            console.log("New message:", change.doc.id, change.doc.data());
          }
        });
      },
      (error) => {
        console.error("Error getting messages:", error);
      },
    );
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
