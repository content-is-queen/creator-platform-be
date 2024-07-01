/* eslint-disable no-prototype-builtins */
const dotenv = require("dotenv");
const { Util } = require("../../helper/utils");
const SendPasswordReset = require("../../services/templates/SendPasswordReset");
const transporter = require("../../helper/mailHelper");
const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const Joi = require("joi");

dotenv.config();
/**
 * @class AuthController
 * @classdesc AuthController
 */

const util = new Util();

const defaultSchema = {
  firstName: Joi.string(),
  lastName: Joi.string(),
  email: Joi.string(),
  password: Joi.string(),
  bio: Joi.string(),
  goals: Joi.string(),
  role: Joi.string(),
};

// Validation schema for creator
const schema = {
  brand: Joi.object({
    ...defaultSchema,
    organizationName: Joi.string(),
    profilePhoto: Joi.string().allow(""),
  }),
  creator: Joi.object({
    ...defaultSchema,
    podcastName: Joi.string().allow(""),
    podcastUrl: Joi.string().uri().allow(""),
    profilePhoto: Joi.string().allow(""),
    interests: Joi.array().allow(""),
    showreel: Joi.string().uri().allow(""),
    showcase: Joi.array().items(Joi.string().uri().max(6)).allow(""),
    credits: Joi.array().items(
      Joi.object({
        episodeLink: Joi.string(),
        role: Joi.string(),
      }).allow(""),
    ),
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
      const { firstName, lastName, email, password, role, ...other } = req.body;

      await schema[role].validateAsync(req.body);

      const db = admin.firestore();
      const user = await admin.auth().createUser({ email, password });

      const uid = user.uid;
      await admin.auth().setCustomUserClaims(uid, { role, subscribed: false });

      const usersCollectionRef = db.collection("users");

      await usersCollectionRef.doc(user.uid).set({
        uid: user.uid,
        firstName,
        lastName,
        role,
        email,
        disabled: false,
        subscribed: false,
        ...other,
      });

      util.statusCode = 200;
      util.setSuccess(200, "Success", { email, uid });
      return util.send(res);
    } catch (error) {
      console.log(error);
      const errorMessage = error?.errorInfo?.message;
      util.statusCode = 500;
      util.message = errorMessage || error.message || " ";
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

  static async forgetPassword(req, res) {
    try {
      const { email } = req.body;
      const userRecord = await admin.auth().getUserByEmail(email);
      if (userRecord.email !== email) {
        return res.status(404).json({ res: "This email is not registered" });
      }
      const secret = process.env.JWT_SECRET + userRecord.uid;
      const payload = {
        uid: userRecord.uid,
      };
      const token = jwt.sign(payload, secret, { expiresIn: "15m" });
      const link = `${process.env.DOMAIN}/reset-password?token=${token}`;
      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Password Reset Request for Your Creator Platform Account",
        html: SendPasswordReset(link),
      };
      await transporter.sendMail(mailOptions);
      return res
        .status(200)
        .json({ message: "Password reset email sent successfully" });
    } catch (error) {
      return res.status(500).json({ message: error.message || "Server error" });
    }
  }

  static async resetUserPassword(req, res) {
    const { password, uid } = req.body;
    try {
      await admin.auth().updateUser(uid, {
        password,
      });
      util.statusCode = 200;
      util.message = "Password updated succesfully";
      return util.send(res);
    } catch (error) {
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
    }
  }

  static async getUser(req, res) {
    const { user_id, role } = req.user;
    const db = admin.firestore();
    try {
      const docRef = db.collection("users").doc(user_id);
      const docSnapshot = await docRef.get();

      if (docSnapshot.exists) {
        const userData = docSnapshot.data();
        if (role === "super_admin" || role === "admin") {
          const settingsRef = userData?.organization;
          if (settingsRef) {
            const settingsSnapshot = await settingsRef?.get();
            console.log(
              settingsSnapshot.data(),
              "??????????????????????????????????????????????????????????",
            );
            if (settingsSnapshot.exists) {
              userData.organizationName =
                settingsSnapshot.data().organizationName;
              userData.organizationLogo =
                settingsSnapshot.data().organizationLogo;
            }
          }
        }
        const { organization, subscribed, ...filteredData } = userData;
        const dataToReturn = { ...filteredData };
        // console.log(filteredData, "??????????????????????????????????????????????????????????");
        return res.status(200).json(dataToReturn);
      } else {
        return res.status(404).json({ message: "No such document!" });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: error.message || "Server error" });
    }
  }

  static async getPublicUser(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        util.statusCode = 400;
        util.message = "User ID is required";
        return util.send(res);
      }

      const db = admin.firestore();
      const usersCollection = db.collection("users").doc(userId);

      const querySnapshot = await usersCollection.get();
      if (!querySnapshot.exists) {
        util.statusCode = 404;
        util.message = "User not found";
        return util.send(res);
      }

      const userData = querySnapshot.data();
      if (userData.role === "super_admin" || userData.role === "admin") {
        const settingsRef = userData?.organization;
        if (settingsRef) {
          const settingsSnapshot = await settingsRef?.get();
          if (settingsSnapshot.exists) {
            userData.organizationName =
              settingsSnapshot.data().organizationName;
            userData.organizationLogo =
              settingsSnapshot.data().organizationLogo;
          }
        }
      }

      const nonSensitiveData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        profilePhoto: userData.profilePhoto,
        bio: userData.bio,
        uid: userData.uid,
        ...(userData.role === "creator" && { interests: userData.interests }),
        ...(userData.organizationName
          ? { organizationName: userData.organizationName }
          : {}),
        ...(userData.organizationLogo
          ? { organizationLogo: userData.organizationLogo }
          : {}),
        meta: {
          ...(userData.role === "creator"
            ? { showcase: userData?.showcase, credits: userData?.credits }
            : {}),
        },
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
        for (const doc of querySnapshot.docs) {
          const userObj = doc.data();
          if (userObj.role === "super_admin" || userObj.role === "admin") {
            const settingsRef = userObj?.organization;
            if (settingsRef) {
              const settingsSnapshot = await settingsRef?.get();
              if (settingsSnapshot.exists) {
                userObj.organizationName =
                  settingsSnapshot.data().organizationName;
                userObj.organizationLogo =
                  settingsSnapshot.data().organizationLogo;
              }
            }
          }
          const { organization, subscribed, ...filteredData } = userObj;
          users.push(filteredData);
        }
      }

      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json({
        statusCode: 500,
        message: error.message || "Server error",
      });
    }
  }

  static async updateUser(req, res) {
    try {
      const { ...valuesToUpdate } = req.body;
      const file = req.files?.profilePhoto;

      if (!file) {
        // If there's no file, update user data directly in Firestore
        const docRef = admin
          .firestore()
          .collection("users")
          .doc(req.user.user_id);
        await docRef.set({ ...valuesToUpdate }, { merge: true });

        util.statusCode = 200;
        util.message = "User updated successfully";
        util.setSuccess(200, "User updated successfully", valuesToUpdate);

        return util.send(res);
      } else {
        // If there's a file, upload it to Firebase Storage
        const storageRef = admin.storage().bucket();
        const fileName = `profile/picture/${uuidv4()}_${file.name}`;
        const uploadTask = storageRef.upload(file.tempFilePath, {
          public: true,
          destination: fileName,
          metadata: {
            firebaseStorageDownloadTokens: uuidv4(),
          },
        });

        uploadTask
          .then(async (snapshot) => {
            // Once uploaded, get the image URL and update user data in Firestore
            const profilePhoto = snapshot[0].metadata.mediaLink;
            const docRef = admin
              .firestore()
              .collection("users")
              .doc(req.user.user_id);

            await docRef.set(
              {
                ...valuesToUpdate,
                profilePhoto,
              },
              { merge: true },
            );

            util.setSuccess(
              200,
              "User profile updated successfully",
              profilePhoto,
            );

            return util.send(res);
          })
          .catch((error) => {
            // Handle errors during file upload
            console.error("Error uploading image:", error);
            util.statusCode = 500;
            util.message = "Failed to upload image";
            return util.send(res);
          });
      }
    } catch (error) {
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

  static async updateUserSubscription(req, res) {
    try {
      const { subscribed } = req.body;
      const { user_id } = req.user; // Assuming you have access to the user's ID
      const docRef = admin.firestore().collection("users").doc(user_id); // Use the user's ID to locate the document in the users collection

      await docRef.set({ subscribed }, { merge: true }); // Update the 'subscribed' field

      util.statusCode = 200;
      util.message = "User subscribed status updated successfully";
      return util.send(res);
    } catch (error) {
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
    }
  }

  static async checkSubscription(req, res) {
    try {
      const { user_id } = req.user;

      if (!user_id) {
        util.statusCode = 400;
        util.message = "User ID is required";
        return util.send(res);
      }

      const db = admin.firestore();
      const docRef = db.collection("users").doc(user_id);
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        util.statusCode = 404;
        util.message = "User not found";
        return util.send(res);
      }

      const userData = docSnapshot.data();
      const isSubscribed = userData.subscribed || false;

      util.statusCode = 200;
      util.message = { subscribed: isSubscribed };
      return util.send(res);
    } catch (error) {
      console.error("Error checking subscription:", error);
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
    }
  }
}

exports.AuthController = AuthController;
