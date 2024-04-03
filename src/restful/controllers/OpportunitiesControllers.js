/* eslint-disable quotes */
import dotenv from "dotenv";
import Util from "../../helper/utils";
import uuid from "uuid";
const admin = require("firebase-admin");
import { v4 as uuidv4 } from "uuid"; // Import uuidv4 directly

dotenv.config();

const util = new Util();

class OpportunitiesController {
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

      const docRef = db.collection("opportunities").doc(doc_type);
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        util.statusCode = 404;
        util.message = `${doc_type} document not found`;
        return util.send(res);
      }

      const docData = docSnapshot.data();

      if (!docData.data || !Array.isArray(docData.data)) {
        util.statusCode = 404;
        util.message = "No opportunities found in this document type";
        return util.send(res);
      }

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

      const docRef = db.collection("opportunities").doc(doc_type);
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        util.statusCode = 404;
        util.message = `${doc_type} document not found`;
        return util.send(res);
      }

      const docData = docSnapshot.data();

      if (!docData.data || !Array.isArray(docData.data)) {
        util.statusCode = 404;
        util.message = "No opportunities found in this document type";
        return util.send(res);
      }

      const opportunityIndex = docData.data.findIndex(
        (op) => op.opportunity_id === opportunity_id
      );

      if (opportunityIndex === -1) {
        util.statusCode = 404;
        util.message = "Opportunity not found";
        return util.send(res);
      }

      docData.data.splice(opportunityIndex, 1);

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

      const docRef = db.collection("opportunities").doc(doc_type);
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        util.statusCode = 404;
        util.message = `${doc_type} document not found`;
        return util.send(res);
      }

      const docData = docSnapshot.data();

      if (!docData.data || !Array.isArray(docData.data)) {
        util.statusCode = 404;
        util.message = "No opportunities found in this document type";
        return util.send(res);
      }

      const opportunityIndex = docData.data.findIndex(
        (op) => op.opportunity_id === opportunity_id
      );

      if (opportunityIndex === -1) {
        util.statusCode = 404;
        util.message = "Opportunity not found";
        return util.send(res);
      }

      if (budget) docData.data[opportunityIndex].budget = budget;
      if (deadline) docData.data[opportunityIndex].deadline = deadline;
      if (description) docData.data[opportunityIndex].description = description;
      if (title) docData.data[opportunityIndex].title = title;
      if (type) docData.data[opportunityIndex].type = type;
      if (user_id) docData.data[opportunityIndex].user_id = user_id;

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

  static async createJobOpportunity(req, res) {
    const db = admin.firestore();
    try {
      const opportunity_id = uuidv4();

      const { type, ...opportunityData } = req.body;

      if (!type || !opportunityData) {
        util.statusCode = 400;
        util.message = "Type and opportunity data are required";
        return util.send(res);
      }

      let allowedFields;
      switch (type) {
        case 'job':
          allowedFields = ['title', 'company', 'description', 'skills', 'experience', 'duration', 'location', 'compensation'];
          break;
        default:
          util.statusCode = 400;
          util.message = "Invalid opportunity type";
          return util.send(res);
      }

      const isValid = allowedFields.every(field => Object.prototype.hasOwnProperty.call(opportunityData, field));
      if (!isValid) {
        util.statusCode = 400;
        util.message = "Missing or invalid fields for the specified opportunity type";
        return util.send(res);
      }

      const collectionRef = db.collection('opportunities').doc('open').collection(type);

      await collectionRef.doc(opportunity_id).set({ opportunity_id, ...opportunityData });

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

  static async createPitchOpportunity(req, res) {
    const db = admin.firestore();
    try {
      const opportunity_id = uuidv4();

      const { type, ...opportunityData } = req.body;

      if (!type || !opportunityData) {
        util.statusCode = 400;
        util.message = "Type and opportunity data are required";
        return util.send(res);
      }

      let allowedFields;
      switch (type) {
        case 'pitch':
          allowedFields = ['project', 'description', 'target', 'format', 'duration', 'budget', 'submission'];
          break;
        default:
          util.statusCode = 400;
          util.message = "Invalid opportunity type";
          return util.send(res);
      }

      const isValid = allowedFields.every(field => Object.prototype.hasOwnProperty.call(opportunityData, field));
      if (!isValid) {
        util.statusCode = 400;
        util.message = "Missing or invalid fields for the specified opportunity type";
        return util.send(res);
      }

      const collectionRef = db.collection('opportunities').doc('open').collection(type);

      await collectionRef.doc(opportunity_id).set({ opportunity_id, ...opportunityData });

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

  static async createCampaignOpportunity(req, res) {
    const db = admin.firestore();
    try {
      const opportunity_id = uuidv4();

      const { type, ...opportunityData } = req.body;

      if (!type || !opportunityData) {
        util.statusCode = 400;
        util.message = "Type and opportunity data are required";
        return util.send(res);
      }

      let allowedFields;
      switch (type) {
        case 'campaign':
          allowedFields = ['name', 'brand', 'goals', 'target', 'budget', 'duration', 'format', 'requirements'];
          break;
        default:
          util.statusCode = 400;
          util.message = "Invalid opportunity type";
          return util.send(res);
      }

      const isValid = allowedFields.every(field => Object.prototype.hasOwnProperty.call(opportunityData, field));
      if (!isValid) {
        util.statusCode = 400;
        util.message = "Missing or invalid fields for the specified opportunity type";
        return util.send(res);
      }

      const collectionRef = db.collection('opportunities').doc('open').collection(type);

      await collectionRef.doc(opportunity_id).set({ opportunity_id, ...opportunityData });

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
