/* eslint-disable quotes */
import dotenv from "dotenv";
import Util from "../../helper/utils";
const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");

dotenv.config();
/**
 * @class AuthController
 * @classdesc AuthController
 */

const util = new Util();

class AuthController {
  /**
   * @param {Object} req request Object.
   * @param {Object} res response Object.
   * @returns {Object} response Object.
   */

  static async profile(req, res) {
    const userId = req.params.userId;
    const db = admin.firestore();
    const usersCollection = db.collection("users");
    try {
      const creatorDoc = await usersCollection.doc("creator").get();
      if (!creatorDoc.exists) {
        return res.status(404).json({ error: "Creator document not found" });
      }

      // Get the user document from the nested collection
      const userDoc = await creatorDoc.ref
        .collection("users")
        .doc(userId)
        .get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }
      const userData = userDoc.data();
      const userArray = [{ ...userData, role: userDoc.id }];
      return res.status(200).json(userArray);
    } catch (error) {
      console.error("Error fetching user data: ", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  static async GetAllUsersprofile(req, res) {
    const userArray = [];
    const db = admin.firestore();
    const usersCollection = db.collection("users");

    try {
      const querySnapshot = await usersCollection.get();
      for (const doc of querySnapshot.docs) {
        const usersRef = doc.ref.collection("users");
        const usersSnapshot = await usersRef.get();

        usersSnapshot.forEach((userDoc) => {
          const transformedObject = {
            ...userDoc.data(),
            role: doc.id,
          };
          userArray.push(transformedObject);
        });
      }
      util.statusCode = 200;
      util.message = userArray;
      return util.send(res);
    } catch (error) {
      util.statusCode = 500;
      util.message = error.mesage || "Server error";
      return util.send(res);
    }
  }

  static async updateProfile(req, res) {
    try {
      const file = req.files.profilePicture;
      const displayName = req.body.username;
      const storageRef = admin
        .storage()
        .bucket(`gs://contentisqueen-97ae5.appspot.com`);
      const uploadTask = storageRef.upload(file.tempFilePath, {
        public: true,
        destination: `profile/picture/${uuidv4()}_${file.name}`,
        metadata: {
          firebaseStorageDownloadTokens: uuidv4(),
        },
      });

      uploadTask
        .then(async (snapshot) => {
          const imageUrl = snapshot[0].metadata.mediaLink;
          const currentUser = await admin.auth().getUser(req.user.user_id);
          const currentCustomClaims = currentUser.customClaims || {};
          const updatedCustomClaims = {
            ...currentCustomClaims,
            role: "brand",
            imageUrl: imageUrl,
            displayName: displayName,
            description:
              "Bacon ipsum dolor amet corned beef meatloaf pig tenderloin beef ribs tri-tip, sirloin buffalo. Fatback meatloaf leberkas filet mignon sirloin, burgdoggen pastrami meatball tail doner frankfurter strip steak spare ribs",
          };
          await admin
            .auth()
            .setCustomUserClaims(req.user.user_id, updatedCustomClaims);

          console.log("Custom claims updated successfully");

          return res.status(200).json({ imageUrl: imageUrl });
        })
        .catch((error) => {
          console.error("Error uploading profile picture:", error);
          return res
            .status(500)
            .json({ error: "Failed to upload profile picture" });
        });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      return res
        .status(500)
        .json({ error: "Failed to update profile picture" });
    }
  }
}

export default AuthController;
