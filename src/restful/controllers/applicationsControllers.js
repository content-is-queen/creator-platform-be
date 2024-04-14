
import dotenv from "dotenv";
import Util from "../../helper/utils";
import { v4 as uuidv4 } from 'uuid';
const admin = require("firebase-admin");

dotenv.config();

const util = new Util();

class ApplicationController {
  static async getAllApplications(req, res) {
    const db = admin.firestore();
    try {
      const applicationsData = [];
  
      // Fetch all documents from the "applications" collection
      const querySnapshot = await db.collection('applications').get();
  
      // Iterate over each document
      querySnapshot.forEach(doc => {
        const data = doc.data();
        applicationsData.push(data);
      });
  
      if (applicationsData.length > 0) {
        util.statusCode = 200;
        util.message = applicationsData;
        return util.send(res);
      } else {
        util.statusCode = 404;
        util.message = "Not found";
        return util.send(res);
      }
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
      const applicationSnapshot = await db.collection('applications').doc(application_id).get();
      if (applicationSnapshot.exists) {
        const applicationData = applicationSnapshot.data();
        util.statusCode = 200;
        util.message = applicationData;
        return util.send(res);
      } else {
        util.statusCode = 404;
        util.message = "Application not found";
        return util.send(res);
      }
    } catch (error) {
      console.log(error);
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
    }
  }

  static async createApplication(req, res) {
    const db = admin.firestore();
    const { user_id, opportunity_id, proposal } = req.body; // Include proposal here
    try {
      const applicationRef = db.collection('applications').doc();
      const newApplicationData = {
        application_id: applicationRef.id,
        user_id,
        opportunity_id,
        proposal, // Include proposal here
        status: 'pending' // Set status to 'pending' here
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
  const { status } = req.body; // Only allow updating the status field
  try {
    const applicationRef = db.collection('applications').doc(application_id);
    
    // Check if the status field is provided
    if (!status) {
      util.statusCode = 400;
      util.message = "Status field is required for updating an application";
      return util.send(res);
    }
    
    // Update the status field only
    await applicationRef.update({ status });
    
    util.statusCode = 200;
    util.message = "Application status updated successfully";
    return util.send(res);
  } catch (error) {
    console.log(error);
    util.statusCode = 500;
    util.message = error.message || "Server error";
    return util.send(res);
  }
}

  static async deleteApplication(req, res) {
    const db = admin.firestore();
    const { application_id } = req.params;
    try {
      await db.collection('applications').doc(application_id).delete();
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

  static async updateApplicationStatus(req, res) {
    const db = admin.firestore();
    try {
      const { opportunity_id } = req.params;
      const { status } = req.body;
  
      // Query the applications collection to find the document(s) with the provided opportunity ID
      const querySnapshot = await db.collection('applications').where('opportunity_id', '==', opportunity_id).get();
  
      // Check if any documents were found
      if (querySnapshot.empty) {
        util.statusCode = 404;
        util.message = 'No applications found for the specified opportunity ID';
        return util.send(res);
      }
  
      // Update the status of each application document found
      const updatePromises = querySnapshot.docs.map(async (doc) => {
        await doc.ref.update({ status });
      });
  
      // Wait for all update operations to complete
      await Promise.all(updatePromises);
  
      util.statusCode = 200;
      util.message = 'Application status updated successfully';
      return util.send(res);
    } catch (error) {
      console.error(error);
      util.statusCode = 500;
      util.message = error.message || 'Server error';
      return util.send(res);
    }
  }
  
  static async getAllApplicationsById(req, res) {
    const { opportunity_id } = req.params;
    try {
      const db = admin.firestore();
      const applicationsRef = db.collection('applications');
      
      // Query applications where opportunity_id matches
      const querySnapshot = await applicationsRef.where('opportunity_id', '==', opportunity_id).get();
      
      if (querySnapshot.empty) {
        return res.status(404).json({ message: 'No applications found for the specified opportunity.' });
      }
      
      // Extract application data from query snapshot
      const applications = [];
      querySnapshot.forEach(doc => {
        applications.push({ id: doc.id, ...doc.data() });
      });
      
      return res.status(200).json(applications);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
}

export default ApplicationController;