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
    try {
      const bucket = admin.storage().bucket();
      const profilePicture = req.files.profilePicture;

      console.log(profilePicture, "_________________-");
      if (!profilePicture || !profilePicture.name) {
        console.error("No profile picture found or name property is missing.");
        return res.status(400).json({ error: "Invalid profile picture" });
      }

      const file = bucket.file(profilePicture.name);
      const stream = file.createWriteStream({
        metadata: {
          contentType: profilePicture.mimetype,
        },
      });

      stream.on("error", (err) => {
        console.error("Error uploading file:", err);
        return res
          .status(500)
          .json({ error: "Failed to upload profile picture" });
      });

      stream.on("finish", async () => {
        console.log("File uploaded successfully.");

        // Get the download URL
        try {
          const [url] = await file.getSignedUrl({
            action: "read",
            expires: "01-01-2025", // URL expiration date
          });

          console.log("Download URL:", url);
          // Send the download URL back in the response
          return res.status(200).json({ url });
        } catch (error) {
          console.error("Error generating download URL:", error);
          return res
            .status(500)
            .json({ error: "Failed to generate download URL" });
        }
      });

      stream.end(profilePicture.data);
    } catch (error) {
      console.error("Error updating profile picture:", error);
      return res
        .status(500)
        .json({ error: "Failed to update profile picture" });
    }
  }
}

export default AuthController;
