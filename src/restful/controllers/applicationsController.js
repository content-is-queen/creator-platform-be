const dotenv = require("dotenv");
const { Util } = require("../../helper/utils");
const admin = require("firebase-admin");
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const util = new Util();

// Define the createRoomAndAddParticipants function
async function createRoom(db, roomId, user_id, user_name, user_image_url, creator_id, creator_name, creator_image_url) {

  const roomData = {
    id: roomId,
    createdAt: new Date().toString(),
    creator: user_id,
    brand: creator_id,
  };

  try {
    await db.collection("rooms").doc(roomId).set(roomData);
    return true;
  } catch (error) {
    console.error("Error creating room:", error);
    return false;
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
      const applicationRef = db.collection("applications").doc();
      const newApplicationData = {
        application_id: applicationRef.id,
        user_id,
        opportunity_id,
        proposal,
        creator_id, // the opportuties user_id
        status: "pending", 
      };
      await applicationRef.set(newApplicationData);
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
    const { status, user_id, creator_id } = req.body; // Include user_id and creator_id in the request body
    try {
      const applicationRef = db.collection("applications").doc(application_id);
  
      // Check if the status field is provided
      if (!status) {
        util.statusCode = 400;
        util.message = "Status field is required for updating an application";
        return util.send(res);
      }
  
      // Update the status field only
      await applicationRef.update({ status });
  
      // If the status is accepted, create a room
      if (status === "accepted") {
        const roomId = uuidv4(); // Generate a unique room ID
  
        // Fetch user and creator data if necessary (optional)
        // const userSnapshot = await db.collection("users").doc(user_id).get();
        // const creatorSnapshot = await db.collection("users").doc(creator_id).get();
  
        // Ensure the snapshots exist before proceeding (optional)
        // if (!userSnapshot.exists || !creatorSnapshot.exists) {
        //   util.statusCode = 404;
        //   util.message = "User or creator not found";
        //   return util.send(res);
        // }
  
        // Extract user and creator data from request body
        const { user_name, user_image_url, creator_name, creator_image_url } = req.body;
  
        // Call createRoom function with data from request body
        await createRoom(db, roomId, user_id, user_name, user_image_url, creator_id, creator_name, creator_image_url);
        
        // Return success response along with the room creation message
        util.statusCode = 200;
        util.message = "Application status updated successfully, room created";
        return util.send(res);
      }
  
      // If status is not "accepted", return success response without room creation message
      util.statusCode = 200;
      util.message = "Application status updated successfully";
      return util.send(res);
    } catch (error) {
      console.error(error);
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

      if (!querySnapshot.empty) {
        // Extract application data from query snapshot
        querySnapshot.forEach((doc) => {
          applications.push({ id: doc.id, ...doc.data() });
        });
      }

      return res.status(200).json(applications);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  }
}

exports.ApplicationsController = ApplicationsController;
