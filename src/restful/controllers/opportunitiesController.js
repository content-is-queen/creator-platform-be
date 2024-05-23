const dotenv = require("dotenv");
const { Util } = require("../../helper/utils");
const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");

dotenv.config();

const util = new Util();

class OpportunitiesController {
  static async getAllOpportunities(req, res) {
    const db = admin.firestore();

    try {
      const opportunitiesData = [];
      const querySnapshot = await db
        .collection("opportunities")
        .where("status", "!=", "archived")
        .get();

      querySnapshot.forEach((doc) => {
        const opportunityData = doc.data();
        opportunitiesData.push(opportunityData);
      });

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
      console.error("Error fetching opportunities:", error);
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
      const querySnapshot = await db
        .collection("opportunities")
        .where("user_id", "==", user_id)
        .get();

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

      const opportunityRef = db.collection("opportunities").doc(opportunity_id);
      const docSnapshot = await opportunityRef.get();

      if (!docSnapshot.exists) {
        return res.status(404).json({ message: "Opportunity not found" });
      }

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

      const querySnapshot = await db
        .collection("opportunities")
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

      const opportunityRef = db.collection("opportunities").doc(opportunity_id);
      const docSnapshot = await opportunityRef.get();

      if (!docSnapshot.exists) {
        return res.status(404).json({ message: "Opportunity not found" });
      }

      await opportunityRef.update({ status: "archived" });
      return res
        .status(200)
        .json({ message: "Opportunity archived successfully" });
    } catch (error) {
      console.error("Error archiving opportunity:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  static async updateOpportunityById(req, res) {
    const db = admin.firestore();
    try {
      const { opportunity_id } = req.params;
      const { type } = req.body;

      const opportunityRef = db.collection("opportunities").doc(opportunity_id);
      const opportunitySnapshot = await opportunityRef.get();

      if (!opportunitySnapshot.exists) {
        return res.status(404).json({ message: "Opportunity not found" });
      }

      if (!type || !["job", "pitch", "campaign"].includes(type)) {
        throw new Error("Invalid or missing opportunity type");
      }

      const requiredFields = getRequiredFields(type);
      const updateData = {};
      requiredFields.forEach((field) => {
        if (req.body.hasOwnProperty(field)) {
          updateData[field] = req.body[field];
        }
      });

      await opportunityRef.update(updateData);
      return res
        .status(200)
        .json({ message: "Opportunity updated successfully", statusCode: 200 });
    } catch (error) {
      console.error("Error updating opportunity:", error);
      return res
        .status(500)
        .json({ message: error.message || "Server error", statusCode: 500 });
    }
  }

  static async createOpportunity(req, res, type) {
    const db = admin.firestore();
    try {
      const opportunity_id = uuidv4();
      const { prompt, ...opportunityData } = req.body;

      if (!opportunityData.hasOwnProperty("status")) {
        opportunityData.status = "open";
      }

      const requiredFields = getRequiredFields(type);
      const missingFields = requiredFields.filter((field) => {
        const value = opportunityData[field];
        return (
          !opportunityData.hasOwnProperty(field) ||
          (typeof value === "string" && value.trim() === "") ||
          (Array.isArray(value) && value.length === 0)
        );
      });

      if (missingFields.length > 0) {
        console.log("Missing or invalid fields:", missingFields);
        util.statusCode = 400;
        util.message = `Missing or invalid fields for ${type} opportunity: ${missingFields.join(", ")}`;
        return util.send(res);
      }

      const existingOpportunity = await db
        .collection("opportunities")
        .doc(opportunity_id)
        .get();
      if (existingOpportunity.exists) {
        util.statusCode = 400;
        util.message = "Opportunity with same ID already exists";
        return util.send(res);
      }

      await db
        .collection("opportunities")
        .doc(opportunity_id)
        .set({
          opportunity_id,
          type,
          prompt,
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
        "user_id",
        "company",
        "description",
        "skills",
        "experience",
        "location",
        "compensation",
        "deadline",
        "contract_type",
      ];
    case "pitch":
      return [
        "title",
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
