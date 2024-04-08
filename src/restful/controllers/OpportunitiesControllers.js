/* eslint-disable quotes */
import dotenv from "dotenv";
import Util from "../../helper/utils";
import uuid from 'uuid';
const admin = require("firebase-admin");
import { v4 as uuidv4 } from 'uuid'; // Import uuidv4 directly

dotenv.config();
/**
 * @class OpportunitiesController
 * @classdesc OpportunitiesController
 */

const util = new Util();
class OpportunitiesController {
  /**
   * @param {Object} req request Object.
   * @param {Object} res response Object.
   * @returns {Object} response Object.
   */å

   static async getAllOpportunities(req, res) {
    const db = admin.firestore();
    try {
      const opportunitiesData = [];
  
      // Fetch all documents from the "opportunities" collection
      const querySnapshot = await db.collection('opportunities').get();
  
      // Iterate over each document
      for (const doc of querySnapshot.docs) {
        // Fetch all subcollections of the document
        const subcollections = await doc.ref.listCollections();
  
        // Iterate over each subcollection
        for (const subcollectionRef of subcollections) {
          // Fetch all documents from the subcollection
          const subcollectionSnapshot = await subcollectionRef.get();
  
          // Iterate over each document in the subcollection
          subcollectionSnapshot.forEach((subDoc) => {
            opportunitiesData.push(subDoc.data());
          });
        }
      }
  
      if (opportunitiesData.length > 0) {
        util.statusCode = 200;
        util.message = opportunitiesData;
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
  
  static async getAllOpportunitiesByUserId(req, res) {
    const db = admin.firestore();
    try {
      const { user_id } = req.params;
  
      if (!user_id) {
        return res.status(400).json({ message: "User ID is required" });
      }
  
      const opportunitiesData = [];
  
      // Fetch all documents from the "opportunities" collection where user_id matches
      const querySnapshot = await db.collection('opportunities').where('user_id', '==', user_id).get();
  
      // Iterate over each document
      querySnapshot.forEach((doc) => {
        const opportunity = doc.data();
        opportunitiesData.push(opportunity);
      });
  
      if (opportunitiesData.length > 0) {
        return res.status(200).json(opportunitiesData);
      } else {
        return res.status(404).json({ message: "No opportunities found for this user" });
      }
    } catch (error) {
      console.error("Error fetching opportunities by user ID:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  static async getOpportunityById(req, res) {
    const db = admin.firestore();
    try {
      const { opportunity_id } = req.params;
  
      if (!opportunity_id) {
        return res.status(400).json({ message: "Opportunity ID is required" });
      }
  
      // Fetch the opportunity document from Firestore
      const opportunityRef = db.collection('opportunities').doc(opportunity_id);
      const docSnapshot = await opportunityRef.get();
  
      if (!docSnapshot.exists) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
  
      // Extract the data of the opportunity
      const opportunityData = docSnapshot.data();
  
      return res.status(200).json(opportunityData);
    } catch (error) {
      console.error("Error fetching opportunity by ID:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }
  

    static async getOpportunitiesByStatus(req, res) {
      const db = admin.firestore();
      try {
          const { status } = req.params;
  
          if (!status || !['open', 'in_progress', 'completed'].includes(status)) {
              util.statusCode = 400;
              util.message = "Invalid or missing opportunity status";
              return util.send(res);
          }
  
          const collectionPath = `opportunities`;
          const querySnapshot = await db.collection(collectionPath).where('status', '==', status).get();
  
          const opportunities = [];
  
          querySnapshot.forEach(doc => {
              opportunities.push(doc.data());
          });
  
          if (opportunities.length > 0) {
              util.statusCode = 200;
              util.message = opportunities;
              return util.send(res);
          } else {
              util.statusCode = 404;
              util.message = `No ${status} opportunities found`;
              return util.send(res);
          }
      } catch (error) {
          console.error(error);
          util.statusCode = 500;
          util.message = error.message || "Server error";
          return util.send(res);
      }
  }
  

  static async deleteOpportunityById(req, res) {
    const db = admin.firestore();
    try {
      const { opportunity_id } = req.params;
  
      if (!opportunity_id) {
        return res.status(400).json({ message: "Opportunity ID is required" });
      }
  
      // Fetch the opportunity document from Firestore
      const opportunityRef = db.collection('opportunities').doc(opportunity_id);
      const docSnapshot = await opportunityRef.get();
  
      if (!docSnapshot.exists) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
  
      // Delete the opportunity
      await opportunityRef.delete();
  
      return res.status(200).json({ message: "Opportunity deleted successfully" });
    } catch (error) {
      console.error("Error deleting opportunity by ID:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }
  

  static async updateOpportunityById(req, res) {
    const db = admin.firestore();
    try {
      const { opportunity_id, doc_type } = req.params;
      const { budget, deadline, description, title, type, user_id } = req.body;
  
      if (!opportunity_id || !doc_type) {
        util.statusCode = 400;
        util.message = "Opportunity ID and document type are required";
        return util.send(res);
      }
  
      if (!budget && !deadline && !description && !title && !type && !user_id) {
        util.statusCode = 400;
        util.message = "At least one field to update is required";
        return util.send(res);
      }
  
      // Get the document reference based on the specified document type
      const docRef = db.collection('opportunities').doc(doc_type);
      const docSnapshot = await docRef.get();
  
      if (!docSnapshot.exists) {
        util.statusCode = 404;
        util.message = `${doc_type} document not found`;
        return util.send(res);
      }
  
      const docData = docSnapshot.data();
  
      // Check if the document type contains a "data" array
      if (!docData.data || !Array.isArray(docData.data)) {
        util.statusCode = 404;
        util.message = "No opportunities found in this document type";
        return util.send(res);
      }
  
      // Find the opportunity index
      const opportunityIndex = docData.data.findIndex(op => op.opportunity_id === opportunity_id);
  
      if (opportunityIndex === -1) {
        util.statusCode = 404;
        util.message = "Opportunity not found";
        return util.send(res);
      }
  
      // Update the opportunity fields
      if (budget) docData.data[opportunityIndex].budget = budget;
      if (deadline) docData.data[opportunityIndex].deadline = deadline;
      if (description) docData.data[opportunityIndex].description = description;
      if (title) docData.data[opportunityIndex].title = title;
      if (type) docData.data[opportunityIndex].type = type;
      if (user_id) docData.data[opportunityIndex].user_id = user_id;
  
      // Update the document data array
      await docRef.update({ data: docData.data });
  
      util.statusCode = 200;
      util.message = "Opportunity updated successfully";
      return util.send(res);
    } catch (error) {
      console.error(error);
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
    }
  }
  
  static async createOpportunity(req, res, type) {
    const db = admin.firestore();
    try {
        // Generate UUID for opportunity_id
        const opportunity_id = uuidv4();

        // Extract opportunity data from request body
        const { ...opportunityData } = req.body;

        // Set default status to "open" if not provided
        if (!opportunityData.hasOwnProperty('status')) {
            opportunityData.status = 'open';
        }

        // Validate required fields
        const requiredFields = getRequiredFields(type);
        const isValid = requiredFields.every(field => Object.prototype.hasOwnProperty.call(opportunityData, field));
        if (!isValid) {
            util.statusCode = 400;
            util.message = `Missing or invalid fields for ${type} opportunity`;
            return util.send(res);
        }

        // Check if opportunity with same ID already exists
        const existingOpportunity = await db.collection('opportunities').doc(opportunity_id).get();
        if (existingOpportunity.exists) {
            util.statusCode = 400;
            util.message = "Opportunity with same ID already exists";
            return util.send(res);
        }

        // Store the opportunity data in the opportunities collection
        await db.collection('opportunities').doc(opportunity_id).set({
            opportunity_id,
            type,
            ...opportunityData
        });

        util.statusCode = 201;
        util.message = "Opportunity created successfully";
        return util.send(res);
    } catch (error) {
        console.error(error);
        util.statusCode = 500;
        util.message = error.message || "Server error";
        return util.send(res);
    }
}


  static async createJobOpportunity(req, res) {
    return OpportunitiesController.createOpportunity(req, res, 'job');
  }

  static async createPitchOpportunity(req, res) {
    return OpportunitiesController.createOpportunity(req, res, 'pitch');
  }

  static async createCampaignOpportunity(req, res) {
    return OpportunitiesController.createOpportunity(req, res, 'campaign');
  }
}

function getRequiredFields(type) {
  switch (type) {
    case 'job':
      return ['title', 'status', 'user_id', 'company', 'description', 'skills', 'experience', 'duration', 'location', 'compensation'];
    case 'pitch':
      return ['project', 'status', 'user_id', 'description', 'target', 'format', 'duration', 'budget', 'submission'];
    case 'campaign':
      return ['name', 'status','user_id','brand', 'goals', 'target', 'budget', 'duration', 'format', 'requirements'];
    default:
      return [];
  }
}


export default OpportunitiesController
