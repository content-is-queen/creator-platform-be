/* eslint-disable quotes */
import dotenv from "dotenv";
import Util from "../../helper/utils";
import uuid from "uuid";
const admin = require("firebase-admin");
import { v4 as uuidv4 } from "uuid"; // Import uuidv4 directly

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
   */

  static async getAllOpportunities(req, res) {
    const db = admin.firestore();
    try {
      const docPath = `opportunities`;
      const profileQuery = await db.collection(docPath).get();
      const opportunitiesData = profileQuery.docs.map((doc) => doc.data());
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

  static async getOpportunityById(req, res) {
    const db = admin.firestore();
    try {
      const { opportunity_id, doc_type } = req.params;

      if (!opportunity_id || !doc_type) {
        util.statusCode = 400;
        util.message = "Opportunity ID and document type are required";
        return util.send(res);
      }

      // Get the document reference based on the specified document type
      const docRef = db.collection("opportunities").doc(doc_type);
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

      // Search for the opportunity within the data array
      const opportunity = docData.data.find(
        (op) => op.opportunity_id === opportunity_id
      );

      if (opportunity) {
        util.statusCode = 200;
        util.message = opportunity;
        return util.send(res);
      } else {
        util.statusCode = 404;
        util.message = "Opportunity not found";
        return util.send(res);
      }
    } catch (error) {
      console.error(error);
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
    }
  }

  static async getOpenOpportunities(req, res) {
    const db = admin.firestore();
    try {
      const collectionPath = `opportunities`;
      const querySnapshot = await db
        .collection(collectionPath)
        .doc("open")
        .get();

      // Check if document exists with the "open" document ID
      if (querySnapshot.exists) {
        const openOpportunityData = querySnapshot.data();
        util.statusCode = 200;
        util.message = openOpportunityData;
        return util.send(res);
      } else {
        util.statusCode = 404;
        util.message = "No open opportunities found";
        return util.send(res);
      }
    } catch (error) {
      console.error(error);
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
    }
  }

  static async getInProgressOpportunities(req, res) {
    const db = admin.firestore();
    try {
      const collectionPath = `opportunities`;
      const querySnapshot = await db
        .collection(collectionPath)
        .doc("in_progress")
        .get();

      // Check if document exists with the "in_progress" document ID
      if (querySnapshot.exists) {
        const inProgressOpportunityData = querySnapshot.data();
        util.statusCode = 200;
        util.message = inProgressOpportunityData;
        return util.send(res);
      } else {
        util.statusCode = 404;
        util.message = "No opportunities in progress found";
        return util.send(res);
      }
    } catch (error) {
      console.error(error);
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
    }
  }

  static async getCompletedOpportunities(req, res) {
    const db = admin.firestore();
    try {
      const collectionPath = `opportunities`;
      const querySnapshot = await db
        .collection(collectionPath)
        .doc("completed")
        .get();

      // Check if document exists with the "completed" document ID
      if (querySnapshot.exists) {
        const completedOpportunityData = querySnapshot.data();
        util.statusCode = 200;
        util.message = completedOpportunityData;
        return util.send(res);
      } else {
        util.statusCode = 404;
        util.message = "No completed opportunities found";
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
      const { opportunity_id, doc_type } = req.params;

      if (!opportunity_id || !doc_type) {
        util.statusCode = 400;
        util.message = "Opportunity ID and document type are required";
        return util.send(res);
      }

      // Get the document reference based on the specified document type
      const docRef = db.collection("opportunities").doc(doc_type);
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

      // Find the index of the opportunity to delete
      const opportunityIndex = docData.data.findIndex(
        (op) => op.opportunity_id === opportunity_id
      );

      if (opportunityIndex === -1) {
        util.statusCode = 404;
        util.message = "Opportunity not found";
        return util.send(res);
      }

      // Remove the opportunity from the data array
      docData.data.splice(opportunityIndex, 1);

      // Update the document's data array without the deleted opportunity
      await docRef.update({ data: docData.data });

      util.statusCode = 200;
      util.message = "Opportunity deleted successfully";
      return util.send(res);
    } catch (error) {
      console.error(error);
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
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
      const docRef = db.collection("opportunities").doc(doc_type);
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
      const opportunityIndex = docData.data.findIndex(
        (op) => op.opportunity_id === opportunity_id
      );

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

  static async createOpportunity(req, res) {
    const db = admin.firestore();
    try {
      // Generate UUID for opportunity_id
      const opportunity_id = uuidv4(); // Use uuidv4 directly

      // Extract opportunity data from request body
      const { budget, deadline, description, title, type, user_id } = req.body;

      // Validate required fields
      if (!budget || !deadline || !description || !title || !type || !user_id) {
        util.statusCode = 400;
        util.message = "Missing required fields";
        return util.send(res);
      }

      // Get the "open" document from the "opportunities" collection
      const openDocRef = db.collection("opportunities").doc("open");
      const openDocSnapshot = await openDocRef.get();

      if (!openDocSnapshot.exists) {
        util.statusCode = 404;
        util.message = "Open document not found";
        return util.send(res);
      }

      // Update the "open" document's data array with the new opportunity data
      const openData = openDocSnapshot.data();
      const newDataArray = [
        ...openData.data,
        {
          opportunity_id,
          budget,
          deadline,
          description,
          title,
          type,
          user_id,
        },
      ];

      // Update the "data" field of the "open" document with the new data array
      await openDocRef.update({ data: newDataArray });

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
}

export default OpportunitiesController;
