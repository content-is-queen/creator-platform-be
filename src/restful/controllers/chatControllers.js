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
    listUsersResult.users?.forEach((userRecord) => {
      // console.log(userRecord);
      return userList.push({
        uid: userRecord.uid,
        email: userRecord.email,
        // Add more user properties as needed
      });
    });

    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);
  return userList;
}

async function fetchProfilesForUsers() {
  const db = admin.firestore();
  const userList = await listAllUsers();
  const profiles = [];

  for (const user of userList) {
    try {
      const docPath = `brand/${user.uid}/profile`;
      const profileQuery = await db.collection(docPath).limit(1).get();
      if (!profileQuery.empty) {
        const profileData = profileQuery.docs[0].data();
        profiles.push({ ...user, ...profileData });
      } else {
        profiles.push({ ...user });
      }
    } catch (error) {
      console.error("Error fetching profile for UID:", user.uid, error);
    }
  }

  return profiles;
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
      const userList = await listAllUsers();
      res.json(userList);
    } catch (error) {
      console.error("Error listing users:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  static async usersProfiles(req, res) {
    try {
      const profiles = await fetchProfilesForUsers();
      res.json({ success: true, profiles });
    } catch (error) {
      console.error("Error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
}

export default ChatController;
