const dotenv = require("dotenv");
const admin = require("firebase-admin");

dotenv.config();

/**
 * @class ChatController
 * @classdesc ChatController
 */
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
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        sender,
        receiver,
      };

      const batch = db.batch();
      batch.set(
        roomRef,
        { id, fullName, lastMessage: message },
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

  static async receiveMessages(req, res) {
    try {
      const { receiverId } = req.params;
      const db = admin.firestore();
      const roomRef = db.collection("rooms").doc(receiverId);
      const messagesRef = roomRef
        .collection("messages")
        .orderBy("createdAt", "desc")
        .limit(10);

      const messagesSnapshot = await messagesRef.get();
      const messages = messagesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json(messages);
    } catch (error) {
      console.error("Error receiving messages:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getUsers(req, res) {
    try {
      const db = admin.firestore();
      const userCollections = await db.collection("users").get();

      const userList = userCollections.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

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

  static async createRoom(req, res) {
    console.log("is this being called");
    try {
      const { id, fullName, userIds } = req.body;

      if (!id || !fullName || !Array.isArray(userIds)) {
        return res.status(400).json({ error: "Invalid request" });
      }

      const db = admin.firestore();
      const roomRef = db.collection("rooms").doc(id);

      const roomData = {
        id,
        fullName,
        lastMessage: "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        userIds,
      };

      await roomRef.set(roomData);

      res.json({ success: true, room: roomData });
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async addUserToRoom(req, res) {
    try {
      const { roomId, userId } = req.body;

      if (!roomId || !userId) {
        return res.status(400).json({ error: "Invalid request" });
      }

      const db = admin.firestore();
      const roomRef = db.collection("rooms").doc(roomId);

      await roomRef.update({
        userIds: admin.firestore.FieldValue.arrayUnion(userId),
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error adding user to room:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

exports.ChatController = ChatController;
