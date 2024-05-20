const dotenv = require("dotenv");
const { Util } = require("../../helper/utils");
const admin = require("firebase-admin");

dotenv.config();
/**
 * @class ChatController
 * @classdesc ChatController
 */
const util = new Util();
class ChatController {
  static async sendMessage(req, res) {
    try {
      const { fullName, id, profile_image, receiver, sender, message } =
        req.body;
      if (
        !message ||
        !sender ||
        !receiver ||
        !profile_image ||
        !id ||
        !fullName
      ) {
        return res.status(400).json({ error: "Invalid request" });
      }
      const db = admin.firestore();
      const roomRef = db.collection("rooms").doc(id);
      const messageData = {
        message,
        createdAt: new Date(),
        sender,
        receiver,
      };
      const batch = db.batch();
      batch.set(
        roomRef,
        { id, fullName, lastMessage: fullName },
        { merge: true },
      );
      const messagesRef = roomRef.collection("messages").doc();
      batch.set(messagesRef, messageData);
      await batch.commit();
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async receiveMessage(req, res) {
    try {
      const receiverId = req.params.receiverId;
      const db = admin.firestore();
      const roomRef = db.collection("rooms").doc(receiverId);
      const messagesRef = roomRef.collection("messages");

      messagesRef.onSnapshot(
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              res.status(200).json({
                message: change.doc.id,
                data: change.doc.data(),
              });
            }
          });
        },
        (error) => {
          console.error("Error getting messages:", error);
          res.status(500).json({ error: "Internal server error" });
        },
      );
    } catch (error) {
      console.error("Error receiving message:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getUsers(req, res) {
    try {
      const db = admin.firestore();
      const userList = [];
      const userCollections = await db.collectionGroup("users").get();
      userCollections.forEach((userDoc) => {
        userDoc.ref
          .collection("users")
          .get()
          .then((userData) => {
            userData.forEach((doc) => {
              userList.push(doc.data());
            });
          });
      });
      res.status(200).json(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getUserProfiles(req, res) {
    try {
      const users = await admin.auth().listUsers();
      const userProfiles = users.users.map((userRecord) => userRecord.toJSON());
      res.status(200).json(userProfiles);
    } catch (error) {
      console.error("Error fetching user profiles:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

exports.ChatController = ChatController;
