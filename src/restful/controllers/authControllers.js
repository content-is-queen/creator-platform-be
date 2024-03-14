/* eslint-disable quotes */
import dotenv from "dotenv";
import Util from "../../helper/utils";
const admin = require("firebase-admin");

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
    const { uid } = req.user;
    const db = admin.firestore();
    try {
      const docPath = `brand/${uid}/profile`;
      const profileQuery = await db.collection(docPath).limit(1).get();
      if (!profileQuery.empty) {
        const profileData = profileQuery.docs[0].data();
        util.statusCode = 200;
        util.message = profileData;
        return util.send(res);
      } else {
        util.statusCode = 404;
        util.message = "Not found";
        return util.send(res);
      }
    } catch (error) {
      util.statusCode = 500;
      util.message = error.mesage || "Server error";
      return util.send(res);
    }
  }

  static async updateProfile(req, res) {
    const { uid } = req.user;
    const { name } = req.body;
    const db = admin.firestore();

    try {
      const docPath = `brand/${uid}/profile`;
      const profileQuery = await db.collection(docPath).limit(1).get();

      if (!profileQuery.empty) {
        const profileDoc = profileQuery.docs[0];
        const currentProfileData = profileDoc.data();
        const updatedProfileData = {
          ...currentProfileData,
          name,
        };
        await profileDoc.ref.update(updatedProfileData);

        util.statusCode = 200;
        util.message = "Profile updated successfully";
        return util.send(res);
      } else {
        util.statusCode = 404;
        util.message = "Profile not found";
        return util.send(res);
      }
    } catch (error) {
      console.error(error);
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
    }
  }
}

export default AuthController;
