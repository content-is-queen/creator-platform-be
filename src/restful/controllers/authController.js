/* eslint-disable no-prototype-builtins */
const dotenv = require("dotenv");
const { Util } = require("../../helper/utils");
/* eslint-disable quotes */
const { sendOtpEmail } = require("../../services/templates/SendOtpEmail");
const {
  SendPasswordReset,
} = require("../../services/templates/SendPasswordReset");
const { transporter } = require("../../helper/mailHelper");
const otpGenerator = require("otp-generator");
const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");
const Joi = require("joi");

dotenv.config();
/**
 * @class AuthController
 * @classdesc AuthController
 */

const util = new Util();

// Validation schema for creator
const schema = {
  brand: Joi.object({
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    organisation_name: Joi.string().required(),
    bio: Joi.string().required(),
    goals: Joi.string().required(),
    profile_photo: Joi.string().required(),
    profile_meta: Joi.string().required(),
  }),
  creator: Joi.object({
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    bio: Joi.string().required(),
    goals: Joi.string().required(),
    podcast_name: Joi.string().required(),
    podcast_url: Joi.string().uri().required(),
    profile_photo: Joi.string().required(),
    profile_meta: Joi.object({
      showreel: Joi.string().uri().required(),
      showcase: Joi.array().items(Joi.string().uri().max(6)).required(),
      credits: Joi.array().items(
        Joi.object({
          show: Joi.string().required(),
          role: Joi.string().required(),
        }),
      ),
    }).required(),
  }),
};

class AuthController {
  /**
   * @param {Object} req request Object.
   * @param {Object} res response Object.
   * @returns {Object} response Object.
   */

  static async signup(req, res) {
    try {
      // Proceed with signup logic if validation succeeds
      const { first_name, last_name, email, password, role, ...other } =
        req.body;

      // Validate request body against schema
      await schema[role].validateAsync(req.body);

      const db = admin.firestore();
      let user = null;

      // Create user in Firebase Authentication
      user = await admin.auth().createUser({
        email,
        password,
      });

      const uid = user.uid;
      await admin.auth().setCustomUserClaims(uid, { role });

      // Generate OTP
      const code = otpGenerator.generate(5, {
        digits: true,
        upperCase: false,
        specialChars: false,
        alphabets: false,
      });

      // Save OTP in Firestore
      await db.collection("otp").doc(email).set({
        otp: code,
      });

      // Send verification email
      const emailTemplate = sendOtpEmail({
        name: first_name,
        email: user.email,
        otp: code,
      });

      const mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: "Creator Platform Account Verification",
        html: emailTemplate,
      };

      const emailSent = await transporter.sendMail(mailOptions);

      if (emailSent) {
        // Save user details in Firestore
        const usersCollectionRef = db.collection("users");

        await usersCollectionRef.doc(user.uid).set({
          uid: user.uid,
          first_name,
          last_name,
          role,
          isActivated: true,
          ...other,
        });

        util.statusCode = 200;
        util.setSuccess(200, "Success", { email, uid });
        return util.send(res);
      } else {
        // Delete the user if email sending failed
        await admin.auth().deleteUser(user.uid);
        util.statusCode = 500;
        util.message = "Failed to send verification email";
        return util.send(res);
      }
    } catch (error) {
      const errorMessage = error?.errorInfo?.message;
      util.statusCode = 500;
      util.message = errorMessage || error.message || "Server error";
      return util.send(res);
    }
  }

  static async verifyOtp(req, res) {
    try {
      const { email, otp, uid } = req.body;
      const db = admin.firestore();

      // Retrieve OTP document
      const otpDoc = await db.collection("otp").doc(email).get();
      const savedOTP = otpDoc.data()?.otp;

      if (savedOTP !== otp) {
        util.statusCode = 400;
        util.message = "Invalid OTP";
        return util.send(res);
      }
      const currentClaims =
        (await admin.auth().getUser(uid)).customClaims || {};
      const updatedClaims = {
        ...currentClaims,
        emailVerified: true,
        isActivated: true,
      };
      await admin.auth().setCustomUserClaims(uid, updatedClaims);
      await db.collection("otp").doc(email).delete();

      util.statusCode = 200;
      util.message = "Your account has been successfully verified.";
      return util.send(res);
    } catch (error) {
      console.error("Error verifying OTP:", error);
      const errorMessage =
        error?.errorInfo?.message || error.message || "Server error";
      util.statusCode = 500;
      util.message = errorMessage;
      return util.send(res);
    }
  }

  static async resetUserPassword(req, res) {
    try {
      const { email } = req.body;
      const actionCodeSettings = {
        url: `${process.env.FRONT_END_URL}/login`,
        handleCodeInApp: true,
      };
      const resetLink = await admin
        .auth()
        .generatePasswordResetLink(email, actionCodeSettings);
      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Password Reset Request for Your Creator Platform Account",
        html: SendPasswordReset(resetLink),
      };
      await transporter.sendMail(mailOptions);

      return res
        .status(200)
        .json({ message: "Password reset email sent successfully" });
    } catch (error) {
      console.error("Error resetting user password:", error);
      return res.status(500).json({ message: error.message || "Server error" });
    }
  }

  static async getUser(req, res) {
    const { user_id } = req.user;
    const db = admin.firestore();

    try {
      const docRef = db.collection("users").doc(user_id);
      const docSnapshot = await docRef.get({ source: "cache" });
      if (docSnapshot.exists) {
        const serverSnapshot = await docRef.get();
        if (
          !serverSnapshot.exists ||
          serverSnapshot.updateTime === docSnapshot.updateTime
        ) {
          util.statusCode = 200;
          util.message = docSnapshot.data();
          return util.send(res);
        } else {
          util.statusCode = 200;
          util.message = serverSnapshot.data();
          return util.send(res);
        }
      }
      util.statusCode = 404;
      util.message = "No such document!";
      return util.send(res);
    } catch (error) {
      console.error("Error fetching user:", error);
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
    }
  }

  static async getPublicUser(req, res) {
    try {
      const { user_id } = req.params; // Extract user ID from URL params

      if (!user_id) {
        util.statusCode = 400;
        util.message = "User ID is required";
        return util.send(res);
      }

      const db = admin.firestore();

      // Construct the path to the user document based on the role and user ID
      const usersCollection = db.collection("users").doc(user_id);

      const querySnapshot = await usersCollection.get();
      if (!querySnapshot.exists) {
        util.statusCode = 404;
        util.message = "User not found";
        return util.send(res);
      }

      const userData = querySnapshot.data();
      // Extract bio and imageUrl from the user document
      const nonSensitiveData = {
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        imageUrl: userData.imageUrl, // Assuming this field exists in the user document
        bio: userData.bio, // Assuming this field exists in the user document
      };

      util.statusCode = 200;
      util.message = nonSensitiveData;
      return util.send(res);
    } catch (error) {
      console.error("Error fetching non-sensitive profile:", error);
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
    }
  }

  static async getAllUsers(req, res) {
    try {
      const db = admin.firestore();
      const usersCollection = db.collection("users");

      const querySnapshot = await usersCollection.get();

      const users = [];

      if (!querySnapshot.empty) {
        querySnapshot.forEach((doc) => {
          const userObj = doc.data();

          // Only push objects with a uid field
          if (userObj.hasOwnProperty("uid")) {
            users.push(userObj);
          }
        });
      }

      return res.status(200).json(users);
    } catch (error) {
      util.statusCode = 500;
      util.message = error.mesage || "Server error";
      return util.send(res);
    }
  }

  static async updateUser(req, res) {
    try {
      // Proceed with update logic if validation succeeds
      const { first_name, last_name, bio } = req.body;
      const file = req.files?.imageUrl;

      if (!file || file === undefined || file === null) {
        // Update user document in Firestore
        const docRef = admin
          .firestore()
          .collection("users")
          .doc(req.user.user_id);
        await docRef.set({ first_name, last_name, bio }, { merge: true });

        util.statusCode = 200;
        util.message = "User updated successfully";
        return util.send(res);
      } else {
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
              .doc(req.user.user_id);
            await docRef.set(
              { first_name, last_name, bio, imageUrl },
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
      }
    } catch (error) {
      console.error("Error updating user profile:", error);
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
    }
  }

  static async changePassword(req, res) {
    const { password } = req.body;
    try {
      await admin.auth().updateUser(req.user?.user_id, {
        password,
      });
      util.statusCode = 200;
      util.message = "Password updated succesfully";
      return util.send(res);
    } catch (error) {
      console.error("Error updating password:", error);
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
    }
  }

  static async checkEmailExists(req, res) {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      if (userRecord) {
        return res.status(200).json({ exists: true });
      }
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        return res.status(200).json({ exists: false });
      }
      console.error("Error checking email existence:", error);
      return res.status(500).json({ message: error.message || "Server error" });
    }
  }

  static async changeEmail(req, res) {
    const { email } = req.body;
    const { user_id } = req.user;
    try {
      if (email !== req.user.email) {
        const docRef = admin
          .firestore()
          .collection("users")
          .doc(req.user.user_id);
        await docRef.set({ email }, { merge: true });
        await admin.auth().updateUser(user_id, {
          email,
        });
      }
      util.statusCode = 200;
      util.message = "Email changed successfully";
      return util.send(res);
    } catch (error) {
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
    }
  }
}

exports.AuthController = AuthController;
