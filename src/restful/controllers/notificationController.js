/* eslint-disable no-prototype-builtins */
const dotenv = require("dotenv");
const { Util } = require("../../helper/utils");
/* eslint-disable quotes */
const admin = require("firebase-admin");

dotenv.config();
/**
 * @class AuthController
 * @classdesc AuthController
 */

const util = new Util();

class NotificationsController {
  /**
   * @param {Object} req request Object.
   * @param {Object} res response Object.
   * @returns {Object} response Object.
   */

 
  static async sendNotification(req, res) {
    const { token, title, body } = req.body;
    try {
    await admin.messaging().send({
        token,
        notification: {
          title,
          body,
        },
      });
      util.statusCode = 200;
      util.message = 'Notification sent successfully';
      return util.send(res);
    } catch (error) {
        util.statusCode = 500;
        util.message = error.message || "Failed to send verification email";
        return util.send(res);
    }
  }

  static async saveFcmToken(req, res) {
    const { fcm_token, user_id } = req.body;
    try {
      const userRef = admin.firestore().collection('users').doc(user_id);
      await userRef.set({ fcm_token }, { merge: true });

      util.statusCode = 200;
      util.message = 'FCM token saved successfully';
      return util.send(res);
    } catch (error) {
      util.statusCode = 500;
      util.message = error.message || "Failed to save FCM token";
      return util.send(res);
    }
  }

}

exports.NotificationsController = NotificationsController;
