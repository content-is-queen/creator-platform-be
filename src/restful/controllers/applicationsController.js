const dotenv = require("dotenv");
const { Util } = require("../../helper/utils");
const admin = require("firebase-admin");
const { SendAcceptEmail } = require("../../services/templates/SendAcceptEmail");
const transporter = require("../../helper/mailHelper");
const sendNotification = require("../../helper/sendNotification");

dotenv.config();

const util = new Util();

async function createRoom(db, participantIds, opportunityTitle) {
  try {
    const [authorId, creatorId] = participantIds;
    const roomId = authorId + "_" + creatorId;
    const roomRef = db.collection("rooms").doc(roomId);
    const roomSnapshot = await roomRef.get();

    // Fetch user data for both user and creator
    const userRef = db.collection("users").doc(authorId);
    const creatorRef = db.collection("users").doc(creatorId);
    const [userSnapshot, creatorSnapshot] = await Promise.all([
      userRef.get(),
      creatorRef.get(),
    ]);

    if (!userSnapshot.exists || !creatorSnapshot.exists) {
      throw new Error("The author or creator could not be found");
    }

    const authorData = userSnapshot.data();
    const creatorData = creatorSnapshot.data();

    if (roomSnapshot.exists) {
      const existingRoomData = roomSnapshot.data();
      return {
        status: 200,
        roomId,
        room: existingRoomData,
      };
    }

    const roomData = {
      id: roomId,
      participantIds,
      lastMessage: "",
      opportunityTitle,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      userProfiles: [
        {
          userId: authorId,
          fullName: `${authorData.firstName} ${authorData.lastName}`,
          profilePhoto: authorData.profilePhoto || "",
        },
        {
          userId: creatorId,
          fullName: `${creatorData.firstName} ${creatorData.lastName}`,
          profilePhoto: creatorData.profilePhoto || "",
        },
      ],
    };

    await roomRef.set(roomData);

    return {
      status: 200,
      roomId,
      room: roomData,
    };
  } catch (error) {
    console.error("Error creating room:", error);
  }
}

class ApplicationsController {
  static async getAllApplications(req, res) {
    const db = admin.firestore();
    try {
      const applicationsData = [];

      // Fetch all documents from the "applications" collection
      const querySnapshot = await db.collection("applications").get();

      // Iterate over each document
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        applicationsData.push(data);
      });

      util.statusCode = 200;
      util.message = applicationsData;
      return util.send(res);
    } catch (error) {
      console.log(error);
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
    }
  }

  static async getApplicationById(req, res) {
    const db = admin.firestore();
    const { applicationId } = req.params;
    try {
      console.log("Fetching application with ID:", applicationId); // Add this line for logging

      const applicationSnapshot = await db
        .collection("applications")
        .doc(applicationId)
        .get();

      if (applicationSnapshot.exists) {
        const applicationData = applicationSnapshot.data();
        util.statusCode = 200;
        util.message = applicationData;
        return util.send(res);
      } else {
        console.log("Application not found:", applicationId); // Add this line for logging
        util.statusCode = 404;
        util.message = "Application not found";
        return util.send(res);
      }
    } catch (error) {
      console.error("Error fetching application:", error); // Add this line for logging
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
    }
  }

  static async createApplication(req, res) {
    const db = admin.firestore();
    const { authorId, opportunityId, proposal, creatorId } = req.body;
    try {
      // Fetch the user document
      const userRef = db.collection("users").doc(authorId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        util.statusCode = 404;
        util.message = "User not found";
        return util.send(res);
      }

      const userData = userDoc.data();

      // Check the number of applications made by the creator
      if (
        userData.opportunities_applied_count >=
        userData.max_opportunities_applied
      ) {
        util.statusCode = 400;
        util.message = `You can only apply to up to ${userData.max_opportunities_applied} opportunities.`;
        return util.send(res);
      }

      const applicationRef = db.collection("applications").doc();
      const newApplicationData = {
        applicationId: applicationRef.id,
        authorId,
        opportunityId,
        proposal,
        creatorId,
        status: "pending",
      };
      await applicationRef.set(newApplicationData);

      // Increment the opportunities_applied_count for the user
      await userRef.update({
        opportunities_applied_count: admin.firestore.FieldValue.increment(1),
      });

      util.statusCode = 201;
      util.message = newApplicationData;
      return util.send(res);
    } catch (error) {
      console.log(error);
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
    }
  }

  static async updateApplication(req, res) {
    const db = admin.firestore();
    const { applicationId } = req.params;
    const { status, authorId, creatorId, opportunityTitle } = req.body;

    try {
      const applicationRef = db.collection("applications").doc(applicationId);

      if (!status) {
        util.statusCode = 400;
        util.message = "Status field is required for updating an application";
        return util.send(res);
      }

      await applicationRef.update({ status });

      if (status === "accepted") {
        const participantIds = [authorId, creatorId];

        // Call createRoom function with data
        const { roomId } = await createRoom(
          db,
          participantIds,
          opportunityTitle,
        );

        const userRef = db.collection("users").doc(user_id);
        const doc = await userRef.get();
        if (doc.exists) {
          const { first_name, email, fcm_token, uid } = doc.data();
          if (email) {
            const emailTemplate = SendAcceptEmail(first_name);

            const mailOptions = {
              from: process.env.EMAIL,
              to: email,
              subject: "Creator Platform Application Update",
              html: emailTemplate,
            };

            await transporter.sendMail(mailOptions);
          }
          if (fcm_token) {
            const notificationData = {
              token: fcm_token,
              title: "Your Application Update",
              body: "Your Application has been approved!",
              user_id: uid,
            };
            await sendNotification(notificationData);
          }
        }

        util.statusCode = 200;
        util.message = { roomId };
        return util.send(res);
      }

      util.statusCode = 200;
      util.message = "Application status updated successfully";
      return util.send(res);
    } catch (error) {
      console.error("Error updating application:", error);
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
    }
  }

  static async deleteApplication(req, res) {
    const db = admin.firestore();
    const { applicationId } = req.params;
    try {
      await db.collection("applications").doc(applicationId).delete();
      util.statusCode = 200;
      util.message = "Application deleted successfully";
      return util.send(res);
    } catch (error) {
      console.log(error);
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
    }
  }

  static async getAllApplicationsById(req, res) {
    const { opportunityId } = req.params;

    try {
      const db = admin.firestore();
      const applicationsRef = db.collection("applications");

      // Query applications where opportunityId matches
      const querySnapshot = await applicationsRef
        .where("opportunityId", "==", opportunityId)
        .get();

      const applications = [];

      console.log(`Query returned ${querySnapshot.size} documents`);

      if (!querySnapshot.empty) {
        // Extract application data from query snapshot
        querySnapshot.forEach((doc) => {
          console.log(`Found application: ${JSON.stringify(doc.data())}`);
          applications.push({ id: doc.id, ...doc.data() });
        });
      } else {
        console.log(
          `No applications found for opportunityId: ${opportunityId}`,
        );
      }

      return res.status(200).json(applications);
    } catch (error) {
      console.error(
        `Error fetching applications for opportunityId: ${opportunityId}`,
        error,
      );
      return res
        .status(500)
        .json({ message: "Server error", error: error.message });
    }
  }
}

exports.ApplicationsController = ApplicationsController;
