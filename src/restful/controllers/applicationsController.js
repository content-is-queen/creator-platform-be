const dotenv = require("dotenv");
const { Util } = require("../../helper/utils");
const admin = require("firebase-admin");
const { v4: uuidv4 } = require('uuid');
const ChatController = require("../controllers/chatController"); 

dotenv.config();

const util = new Util();

async function createRoomDirect(db, roomId, userIds) {
  try {
    const roomRef = db.collection("rooms").doc(roomId);
    const roomData = {
      id: roomId,
      userIds,
      lastMessage: "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await roomRef.set(roomData);

    return {
      status: 200,
      message: "Room created successfully",
      roomId: roomId,
      room: roomData
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
    const { creator_id, opportunity_id, proposal, brand_id } = req.body; 
    try {
      const applicationRef = db.collection("applications").doc();
      const newApplicationData = {
        application_id: applicationRef.id,
        creator_id,
        opportunity_id,
        proposal,
        brand_id, // the opportuties creator_id
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
    const { status, creator_id, brand_id, user_name, user_image_url, brand_name, brand_image_url } = req.body;

    try {
        const applicationRef = db.collection("applications").doc(application_id);

        if (!status) {
            util.statusCode = 400;
            util.message = "Status field is required for updating an application";
            return util.send(res);
        }

        await applicationRef.update({ status });

        if (status === "accepted") {
            const roomId = 'chat_'+(creator_id < brand_id? creator_id+"_"+brand_id : brand_id+"_"+creator_id)
            const userIds = [creator_id, brand_id];
            // Call createRoom function with data
            await createRoomDirect(db, roomId, userIds);
            util.statusCode = 200;
            util.message = "Application status updated successfully, room created"  ;
                // Include roomId in the message
            util.message += `, roomId: ${roomId}`;
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
