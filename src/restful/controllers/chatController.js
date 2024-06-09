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

      console.log("Message:", message); // Log the message to check its content

      const db = admin.firestore();
      const roomRef = db.collection("rooms").doc(id);

      const messageData = {
        message,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        sender,
        receiver,
      };

      const batch = db.batch();
      const messagesRef = roomRef.collection("messages").doc();
      batch.set(messagesRef, messageData);

      // Update the lastMessage, lastMessageSender, lastMessageSenderProfileImage, and lastMessageSenderFullName fields with the latest message details
      batch.update(roomRef, {
        lastMessage: message,
        lastMessageSender: sender,
        lastMessageSenderProfileImage: profile_image,
        lastMessageSenderFullName: fullName,
      });

      await batch.commit();
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getRoomInfo(req, res) {
    try {
      const roomId = req.params.roomId;
      const db = admin.firestore();
      const roomRef = db.collection("rooms").doc(roomId);
      const roomSnapshot = await roomRef.get();

      if (!roomSnapshot.exists) {
        return res.status(404).json({ error: "Room not found" });
      }

      const roomData = roomSnapshot.data();

      // Fetch the last message details
      const messagesRef = roomRef
        .collection("messages")
        .orderBy("createdAt", "desc")
        .limit(1);
      const messagesSnapshot = await messagesRef.get();
      if (messagesSnapshot.empty) {
        return res.status(200).json({ ...roomData, lastMessageSender: null });
      }

      const lastMessageData = messagesSnapshot.docs[0].data();
      const lastMessageSenderId = lastMessageData.sender;

      // Fetch the user details of the sender of the last message
      const userRef = db.collection("users").doc(lastMessageSenderId);
      const userSnapshot = await userRef.get();

      if (!userSnapshot.exists) {
        return res.status(200).json({ ...roomData, lastMessageSender: null });
      }

      const userData = userSnapshot.data();

      // Prepare the response with last message sender details
      const response = {
        ...roomData,
        lastMessageSender: {
          fullName: `${userData.first_name} ${userData.last_name}`,
          profileImage: userData.imageUrl,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Error fetching room info:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getUserRooms(req, res) {
    try {
      const { userId } = req.params; // Assuming you have user information in the request
      const db = admin.firestore();
      const roomsRef = db
        .collection("rooms")
        .where("userIds", "array-contains", userId);
      const roomsSnapshot = await roomsRef.get();

      const userRooms = [];
      roomsSnapshot.forEach((roomDoc) => {
        const roomData = roomDoc.data();
        userRooms.push({
          id: roomDoc.id,
          ...roomData,
        });
      });

      res.status(200).json(userRooms);
    } catch (error) {
      console.error("Error fetching user rooms:", error);
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

  static async getMessages(req, res) {
    try {
      const roomId = req.params.roomId;
      const db = admin.firestore();
      const messagesRef = db
        .collection("rooms")
        .doc(roomId)
        .collection("messages");
      const snapshot = await messagesRef.get();

      const messages = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const messageData = doc.data();
          const senderRef = db.collection("users").doc(messageData.sender);
          const senderSnapshot = await senderRef.get();
          const senderData = senderSnapshot.exists ? senderSnapshot.data() : {};

          return {
            id: doc.id,
            ...messageData,
            senderDetails: {
              fullName: `${senderData.first_name} ${senderData.last_name}`,
              profileImage: senderData.imageUrl,
            },
          };
        }),
      );

      res.status(200).json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async createRoom(req, res) {
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
        lastMessageSender: "",
        lastMessageSenderProfileImage: "",
        lastMessageSenderFullName: "",
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
