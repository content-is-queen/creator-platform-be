const dotenv = require("dotenv");
const { Util } = require("../../helper/utils");
const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid"); // Import uuidv4 directly

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
      const opportunitiesData = [];

      // Recursive function to fetch all documents and subcollections
      const getAllDocuments = async (collectionRef) => {
        const querySnapshot = await collectionRef.get();

        // Iterate over each document
        querySnapshot.forEach((doc) => {
          const opportunityData = doc.data();
          opportunitiesData.push(opportunityData);

          // Fetch subcollections recursively
          const subcollections = doc.ref.listCollections();
          subcollections
            .then((subcollectionRefs) => {
              subcollectionRefs.forEach((subcollectionRef) => {
                getAllDocuments(subcollectionRef);
              });
            })
            .catch((error) => {
              console.error("Error fetching subcollections:", error);
            });
        });
      };

      // Start fetching documents from the root collection
      await getAllDocuments(db.collection("opportunities"));

      util.statusCode = 200;
      util.message = opportunitiesData;
      return util.send(res);
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
      const querySnapshot = await db
        .collection("opportunities")
        .where("user_id", "==", user_id)
        .get();

      // Iterate over each document
      querySnapshot.forEach((doc) => {
        const opportunity = doc.data();
        opportunitiesData.push(opportunity);
      });

      return res.status(200).json(opportunitiesData);
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
      const opportunityRef = db.collection("opportunities").doc(opportunity_id);
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

      if (!status || !["open", "in_progress", "completed"].includes(status)) {
        util.statusCode = 400;
        util.message = "Invalid or missing opportunity status";
        return util.send(res);
      }

      const collectionPath = `opportunities`;
      const querySnapshot = await db
        .collection(collectionPath)
        .where("status", "==", status)
        .get();

      const opportunities = [];

      querySnapshot.forEach((doc) => {
        opportunities.push(doc.data());
      });

      util.statusCode = 200;
      util.message = opportunities;
      return util.send(res);
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
      const opportunityRef = db.collection("opportunities").doc(opportunity_id);
      const docSnapshot = await opportunityRef.get();

      if (!docSnapshot.exists) {
        return res.status(404).json({ message: "Opportunity not found" });
      }

      // Delete the opportunity
      await opportunityRef.delete();

      return res
        .status(200)
        .json({ message: "Opportunity deleted successfully" });
    } catch (error) {
      console.error("Error deleting opportunity by ID:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  static async updateOpportunityById(req, res) {
    const db = admin.firestore();
    try {
      const { opportunity_id } = req.params;
      const { budget, deadline, description, title, user_id } = req.body;

      // Check if any fields are provided for update
      if (!budget && !deadline && !description && !title && !user_id) {
        return res
          .status(400)
          .json({ message: "At least one field to update is required" });
      }

      // Fetch the opportunity document
      const opportunityRef = db.collection("opportunities").doc(opportunity_id);
      const opportunitySnapshot = await opportunityRef.get();

      // Check if the opportunity exists
      if (!opportunitySnapshot.exists) {
        return res.status(404).json({ message: "Opportunity not found" });
      }

      // Extract existing opportunity data
      const existingData = opportunitySnapshot.data();

      // Prepare the update object with only provided fields
      const updateData = {};
      if (budget) updateData.budget = budget;
      if (deadline) updateData.deadline = deadline;
      if (description) updateData.description = description;
      if (title) updateData.title = title;
      if (user_id) updateData.user_id = user_id;

      // Perform the update
      await opportunityRef.update(updateData);

      // Return success response
      return res
        .status(200)
        .json({ message: "Opportunity updated successfully" });
    } catch (error) {
      console.error("Error updating opportunity:", error);
      return res.status(500).json({ message: "Server error" });
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
      if (!opportunityData.hasOwnProperty("status")) {
        opportunityData.status = "open";
      }

      // Validate required fields
      const requiredFields = getRequiredFields(type);
      const isValid = requiredFields.every((field) =>
        Object.prototype.hasOwnProperty.call(opportunityData, field),
      );
      if (!isValid) {
        util.statusCode = 400;
        util.message = `Missing or invalid fields for ${type} opportunity`;
        return util.send(res);
      }

      // Check if opportunity with same ID already exists
      const existingOpportunity = await db
        .collection("opportunities")
        .doc(opportunity_id)
        .get();
      if (existingOpportunity.exists) {
        util.statusCode = 400;
        util.message = "Opportunity with same ID already exists";
        return util.send(res);
      }

      // Store the opportunity data in the opportunities collection
      await db
        .collection("opportunities")
        .doc(opportunity_id)
        .set({
          opportunity_id,
          type,
          ...opportunityData,
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
    return OpportunitiesController.createOpportunity(req, res, "job");
  }

  static async createPitchOpportunity(req, res) {
    return OpportunitiesController.createOpportunity(req, res, "pitch");
  }

  static async createCampaignOpportunity(req, res) {
    return OpportunitiesController.createOpportunity(req, res, "campaign");
  }
}

function getRequiredFields(type) {
  switch (type) {
    case "job":
      return [
        "title",
        "status",
        "user_id",
        "company",
        "description",
        "skills",
        "experience",
        "duration",
        "location",
        "compensation",
        "deadline",
        "contract_type",
      ];
    case "pitch":
      return [
        "title",
        "status",
        "user_id",
        "description",
        "target",
        "format",
        "compensation",
        "submission",
        "deadline",
        "contract_type",
      ];
    case "campaign":
      return [
        "title",
        "status",
        "user_id",
        "brand",
        "description",
        "target",
        "compensation",
        "format",
        "requirements",
        "deadline",
        "contract_type",
      ];
    default:
      return [];
  }
}

exports.OpportunitiesController = OpportunitiesController;
