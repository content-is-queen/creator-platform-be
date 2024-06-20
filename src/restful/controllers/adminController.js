/* eslint-disable no-prototype-builtins */
const dotenv = require("dotenv");
const admin = require("firebase-admin");
const { Util } = require("../../helper/utils");
/* eslint-disable quotes */

dotenv.config();
/**
 * @class AuthController
 * @classdesc AuthController
 */

const util = new Util();

class AdminController {
  /**
   * @param {Object} req request Object.
   * @param {Object} res response Object.
   * @returns {Object} response Object.
   */

  static async adminCreateUser(req, res) {
    const { firstName, lastName, email, role, password } = req.body;
    let uid = null;
    const db = admin.firestore();
    try {
      const user = await admin.auth().createUser({
        email,
        password,
      });

      uid = user.uid;
      await admin
        .auth()
        .setCustomUserClaims(uid, { role, emailVerified: true });
      const usersCollectionRef = db.collection("users");

      const userData = {
        uid: user.uid,
        email,
        firstName,
        lastName,
        role,
        ...((role === "creator" || role === "brand") && { subscribed: false }), // Add subscription field for admin or creators
        disabled: false,
      };
      if (role === "admin" || role === "super_admin") {
        userData.organization = db.doc("organizationInfo/ciq");
      }

      await usersCollectionRef.doc(user.uid).set(userData);

      util.statusCode = 200;
      util.setSuccess(200, "User created successfully!");
      return util.send(res);
    } catch (error) {
      if (uid) {
        const userRecord = await admin.auth().getUser(uid);
        await admin.auth().deleteUser(userRecord);
      }
      const errorMessage = error?.errorInfo?.message;
      util.statusCode = 500;
      util.message = errorMessage || error.message || "Server error";
      return util.send(res);
    }
  }

  static async adminActivateUser(req, res) {
    const { userId } = req.params;
    try {
      const db = admin.firestore();
      await admin.auth().updateUser(userId, { disabled: false });
      const usersCollectionRef = db.collection("users");
      await usersCollectionRef
        .doc(userId)
        .set({ disabled: false }, { merge: true });
      util.statusCode = 200;
      util.setSuccess(200, "User activated successfully!");
      return util.send(res);
    } catch (error) {
      console.log(error);
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
    }
  }

  static async adminDeActivateUser(req, res) {
    const { userId } = req.params;
    try {
      const db = admin.firestore();
      await admin.auth().updateUser(userId, { disabled: true });
      const usersCollectionRef = db.collection("users");
      await usersCollectionRef
        .doc(userId)
        .set({ disabled: true }, { merge: true });
      util.statusCode = 200;
      util.setSuccess(200, "User deactivated successfully!");
      return util.send(res);
    } catch (error) {
      console.log(error);
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
    }
  }

  static async admingetAllUsers(req, res) {
    try {
      const db = admin.firestore();
      const usersCollection = db.collection("users");

      const querySnapshot = await usersCollection.get();

      const users = [];

      if (!querySnapshot.empty) {
        querySnapshot.forEach((doc) => {
          const userObj = doc.data();
          // Only push objects with a uid field
          if (Object.hasOwn(userObj, "uid")) {
            users.push(userObj);
          }
        });
      }

      return res.status(200).json(users);
    } catch (error) {
      console.log(error);
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
    }
  }

  static async adminDeleteUser(req, res) {
    const { userId } = req.params;
    try {
      const db = admin.firestore();
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();
      const profilePhoto = userData?.profilePhoto;
      await admin.auth().deleteUser(userId);
      await db.collection("users").doc(userId).delete();
      if (profilePhoto) {
        const fileName = profilePhoto.split("/").pop();
        const bucket = admin.storage().bucket();
        await bucket.file(`profile/picture/${fileName}`).delete();
      }

      util.statusCode = 200;
      util.setSuccess(200, "User deleted successfully!");
      return util.send(res);
    } catch (error) {
      console.log(error);
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
    }
  }

  static async adminUpdateUserLimits(req, res) {
    const { userId } = req.params;
    const { maxOpportunities, maxOpportunitiesApplied } = req.body;

    const db = admin.firestore();

    try {
      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        util.statusCode = 404;
        util.message = "User not found";
        return util.send(res);
      }

      const updateData = {};

      if (maxOpportunities !== undefined) {
        updateData.maxOpportunities = maxOpportunities;
      }
      if (maxOpportunitiesApplied !== undefined) {
        updateData.maxOpportunitiesApplied = maxOpportunitiesApplied;
      }

      await userRef.update(updateData);

      util.statusCode = 200;
      util.setSuccess(200, "User limits updated successfully!");
      return util.send(res);
    } catch (error) {
      console.log(error);
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
    }
  }

  static async adminGetInfo(req, res) {
    try {
      const db = admin.firestore();
      const usersQuery = await db.collection("users").get();
      const subscribedUsersQuery = await db
        .collection("users")
        .where("subscribed", "==", true)
        .get();
      const opportunitiesQuery = await db.collection("opportunities").get();
      const completedOpportunitiesQuery = await db
        .collection("opportunities")
        .where("status", "==", "completed")
        .get();
      const infoData = [
        { title: "Users", value: `${usersQuery.size}` },
        { title: "Subscribed Users", value: `${subscribedUsersQuery.size}` },
        { title: "Opportunities", value: `${opportunitiesQuery.size}` },
        {
          title: "Completed Opportunities",
          value: `${completedOpportunitiesQuery.size}`,
        },
      ];

      util.setSuccess(200, "Admin data retirved successfully!", infoData);
      return util.send(res);
    } catch (error) {
      util.statusCode = 500;
      util.message = error.mesage || "Server error";
      return util.send(res);
    }
  }

  static async getAllOpportunities(req, res) {
    const db = admin.firestore();

    try {
      const applicationsSnapshot = await db
        .collectionGroup("applications")
        .get();
      const opportunityApplicationsCount = {};

      // Count the number of applications for each opportunity
      applicationsSnapshot.forEach((doc) => {
        const applicationData = doc.data();
        const opportunityId = applicationData.opportunityId;
        if (opportunityApplicationsCount[opportunityId]) {
          opportunityApplicationsCount[opportunityId]++;
        } else {
          opportunityApplicationsCount[opportunityId] = 1;
        }
      });

      // Fetch opportunities separately
      const opportunitiesSnapshot = await db
        .collection("opportunities")
        .where("status", "!=", "archived")
        .get();

      // Fetch user data for each opportunity asynchronously
      const opportunitiesDataPromises = opportunitiesSnapshot.docs.map(
        async (doc) => {
          const opportunityData = doc.data();
          const userId = opportunityData.userId;
          const userRef = db.collection("users").doc(userId);
          const userDoc = await userRef.get();
          const userData = userDoc.data();
          const opportunityId = doc.id;

          return {
            ...opportunityData,
            numberOfApplications:
              opportunityApplicationsCount[opportunityId] || 0,
            fullName: userData?.firstName + " " + userData?.lastName,
          };
        },
      );

      // Wait for all promises to resolve
      const opportunitiesData1 = await Promise.all(opportunitiesDataPromises);

      if (opportunitiesData1.length > 0) {
        util.statusCode = 200;
        util.message = opportunitiesData1;
        return util.send(res);
      } else {
        util.statusCode = 404;
        util.message = "Not found";
        return util.send(res);
      }
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
    }
  }

  static async getCompanyInfo(req, res) {
    try {
      const db = admin.firestore();
      const ciQRef = db.collection("organizationInfo").doc("ciq");
      const userDoc = await ciQRef.get();
      util.setSuccess(200, userDoc.data());
      return util.send(res);
    } catch (error) {
      util.statusCode = 500;
      util.message = error.message || "Error fetching companiy's data";
      return util.send(res);
    }
  }

  static async updateCompanyInfo(req, res) {
    try {
      const { organizationName, organizationBio, organizationLogo } = req.body;
      if (!organizationName && !organizationBio) {
        util.statusCode = 400;
        util.message = "Organization name and bio is required.";
        return util.send(res);
      }
      const db = admin.firestore();
      const ciQRef = db.collection("organizationInfo").doc("ciq");
      const updateData = {};

      if (organizationName) {
        updateData.organizationName = organizationName;
      }

      if (organizationBio !== undefined) {
        updateData.organizationBio = organizationBio;
      }

      if (organizationLogo) {
        updateData.organizationLogo = organizationLogo;
      }
      await ciQRef.set(updateData, { merge: true });
      util.setSuccess(
        200,
        updateData,
        "Organization info updated successfully!",
      );
      return util.send(res);
    } catch (error) {
      util.statusCode = 500;
      util.message = error.message || "Error updating Organization's data";
      return util.send(res);
    }
  }
}

exports.AdminController = AdminController;
