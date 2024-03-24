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

  static async signupBrand(req, res) {
    const { email, password, confirm_password } = req.body;
    if (password !== confirm_password) {
      util.statusCode = 400;
      util.message = "Password do not match";
      return util.send(res);
    }
    const db = admin.firestore();
    try {
      const user = await admin.auth().createUser({
        email,
        password,
      });
      console.log(user);
      const uid = user.uid;
      await admin.auth().setCustomUserClaims(uid, { role: "brand" });
      const token = await admin.auth().createCustomToken(uid);
      const usersCollectionRef = db.collection("users");
      const brandDocRef = usersCollectionRef.doc("brand");
      const brandDocSnapshot = await brandDocRef.get();

      if (!brandDocSnapshot.exists) {
        await brandDocRef.set({});
      }

      const usersBrandCollectionRef = brandDocRef.collection("users");
      await usersBrandCollectionRef.doc(user.uid).set({ uid: user.uid });
      util.statusCode = 200;
      util.message = { token };
      return util.send(res);
    } catch (error) {
      const errorMessage = error?.errorInfo?.message;
      console.log(error);
      util.statusCode = 500;
      util.message = errorMessage || error.message || "Server error";
      return util.send(res);
    }
  }

  static async signupCreator(req, res) {
    const { email, password, confirm_password, podcast_name } = req.body;
    if (password !== confirm_password) {
      util.statusCode = 400;
      util.message = "Password do not match";
      return util.send(res);
    }
    const db = admin.firestore();
    try {
      const user = await admin.auth().createUser({
        email,
        password,
      });
      console.log(user);
      const uid = user.uid;
      await admin.auth().setCustomUserClaims(uid, { role: "creator" });
      const token = await admin.auth().createCustomToken(uid);
      const usersCollectionRef = db.collection("users");
      const brandDocRef = usersCollectionRef.doc("creator");
      const brandDocSnapshot = await brandDocRef.get();

      if (!brandDocSnapshot.exists) {
        await brandDocRef.set({});
      }

      const usersBrandCollectionRef = brandDocRef.collection("users");
      await usersBrandCollectionRef
        .doc(user.uid)
        .set({ uid: user.uid, podcast_name });
      util.statusCode = 200;
      util.message = { token };
      return util.send(res);
    } catch (error) {
      const errorMessage = error?.errorInfo?.message;
      console.log(error);
      util.statusCode = 500;
      util.message = errorMessage || error.message || "Server error";
      return util.send(res);
    }
  }

  static async profile(req, res) {
    const userArray = [];
    const db = admin.firestore();
    const usersCollection = db.collection("users");
    console.log(req.user);

    try {
      //   const querySnapshot = await usersCollection.get();
      //   for (const doc of querySnapshot.docs) {
      //     const usersRef = doc.ref.collection("users");
      //     const usersSnapshot = await usersRef.get();
      //     usersSnapshot.forEach((userDoc) => {
      //       if (userDoc.id === req.user.user_id) {
      //         const transformedObject = {
      //           ...userDoc.data(),
      //           role: doc.id,
      //         };
      //         console.log(transformedObject, "transformed arrau");
      //         return userArray.push(transformedObject);
      //       }
      //     });
      //   }
      //   util.statusCode = 200;
      //   util.message = userArray;
      //   return util.send(res);
    } catch (error) {
      util.statusCode = 500;
      util.message = error.mesage || "Server error";
      return util.send(res);
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
    console.log(req.body, "FFFFFFFFFFFFFFFFFFF");
    try {
      const file = req.files.profilePicture;
      const { displayName, description, role } = req.body;
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
          const docRef = admin
            .firestore()
            .collection("users")
            .doc(role)
            .collection("users")
            .doc(req.user.user_id);
          await docRef.set(
            { displayName, imageUrl, description },
            { merge: true },
          );
          util.statusCode = 200;
          util.message = "Document updated successfully";
          return util.send(res);
        })
        .catch((error) => {
          util.statusCode = 500;
          util.message = error.message || "Server error";
          return util.send(res);
        });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      util.statusCode = 500;
      util.message = error.mesage || "Server error";
      return util.send(res);
    }
  }
}

export default AuthController;
