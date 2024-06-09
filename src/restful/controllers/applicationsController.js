const dotenv = require("dotenv");
const { Util } = require("../../helper/utils");
const admin = require("firebase-admin");

dotenv.config();

const util = new Util();

async function createRoomDirect(db, userIds, opportunityId) {
  try {
    const [user_id, creator_id] = userIds;
    const roomId = user_id + "_" + creator_id;
    const roomRef = db.collection("rooms").doc(roomId);
    const roomSnapshot = await roomRef.get();

    // Fetch opportunity data to get the title
    const opportunityRef = db.collection("opportunities").doc(opportunityId);
    const opportunitySnapshot = await opportunityRef.get();

    if (!opportunitySnapshot.exists) {
      throw new Error("Opportunity not found");
    }

    const opportunityData = opportunitySnapshot.data();
    const opportunityTitle = opportunityData.title;

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
      userIds,
      lastMessage: "",
      opportunityTitle, // Include opportunity title
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await roomRef.set(roomData);

    return {
      status: 200,
      roomId,
      room: roomData,
    };
  } catch (error) {
    console.error("Error creating room:", error);
    throw new Error("Internal server error");
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
    const { application_id } = req.params;
    try {
      console.log("Fetching application with ID:", application_id); // Add this line for logging

      const applicationSnapshot = await db
        .collection("applications")
        .doc(application_id)
        .get();

      if (applicationSnapshot.exists) {
        const applicationData = applicationSnapshot.data();
        util.statusCode = 200;
        util.message = applicationData;
        return util.send(res);
      } else {
        console.log("Application not found:", application_id); // Add this line for logging
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
    const { user_id, opportunity_id, proposal, creator_id } = req.body;
    try {
      // Fetch the user document
      const userRef = db.collection("users").doc(user_id);
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
        application_id: applicationRef.id,
        user_id,
        opportunity_id,
        proposal,
        creator_id, // the opportunities user_id
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
    const { application_id } = req.params;
    const { status, user_id, creator_id, opportunity_id } = req.body;

    try {
      const applicationRef = db.collection("applications").doc(application_id);

      if (!status) {
        util.statusCode = 400;
        util.message = "Status field is required for updating an application";
        return util.send(res);
      }

      await applicationRef.update({ status });

      if (status === "accepted") {
        const userIds = [user_id, creator_id];

        // Call createRoom function with data
        const { roomId } = await createRoomDirect(db, userIds, opportunity_id);

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
    const { application_id } = req.params;
    try {
      await db.collection("applications").doc(application_id).delete();
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
    const { opportunity_id } = req.params;

    try {
      const db = admin.firestore();
      const applicationsRef = db.collection("applications");

      // Query applications where opportunity_id matches
      const querySnapshot = await applicationsRef
        .where("opportunity_id", "==", opportunity_id)
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
          `No applications found for opportunity_id: ${opportunity_id}`,
        );
      }

      return res.status(200).json(applications);
    } catch (error) {
      console.error(
        `Error fetching applications for opportunity_id: ${opportunity_id}`,
        error,
      );
      return res
        .status(500)
        .json({ message: "Server error", error: error.message });
    }
  }
}

exports.ApplicationsController = ApplicationsController;
