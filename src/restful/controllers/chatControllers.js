/* eslint-disable quotes */
import dotenv from "dotenv";
// import Util from "../../helper/utils";
const admin = require("firebase-admin");

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
    batch.set(
      roomRef,
      { id: roomName, name: roomName, lastMessage: messageData },
      { merge: true },
    );

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
            res.status.json({
              message: change.doc.id,
              data: change.doc.data(),
            });
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
      // Start listing users from the beginning, 1000 at a time.
      let users = [];
      let nextPageToken;
      do {
        let result = await admin.auth().listUsers(1000, nextPageToken);
        nextPageToken = result.pageToken;
        users = users.concat(result.users);
      } while (nextPageToken);

      users.forEach((userRecord) => {
        console.log("user", userRecord.toJSON());
      });

      console.log(users);
      console.log("Total users:", users.length);
    } catch (error) {
      console.error("Error listing users:", error);
    }
  }

  static async usersProfiles(req, res) {
    try {
      // Start listing users from the beginning, 1000 at a time.
      let users = [];
      let nextPageToken;
      do {
        let result = await admin.auth().listUsers(1000, nextPageToken);
        nextPageToken = result.pageToken;
        users = users.concat(result.users);
      } while (nextPageToken);

      users.forEach((userRecord) => {
        console.log("user", userRecord.toJSON());
      });

      console.log(users);
      console.log("Total users:", users.length);
    } catch (error) {
      console.error("Error listing users:", error);
    }
  }
}

export default ChatController;
