const dotenv = require("dotenv");
const { Util } = require("../../helper/utils");
const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");

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
    const { limit = 10, startAfter: startAfterId = null } = req.query;

    try {
      const opportunitiesData = [];
      let query = db
        .collection("opportunities")
        .where("status", "!=", "archived")
        .orderBy("status")
        .limit(parseInt(limit));

      if (startAfterId) {
        const startAfterDoc = await db
          .collection("opportunities")
          .doc(startAfterId)
          .get();
        if (startAfterDoc.exists) {
          query = query.startAfter(startAfterDoc);
        } else {
          return res.status(400).json({ message: "Invalid startAfter ID" });
        }
      }

      const querySnapshot = await query.get();

      querySnapshot.forEach((doc) => {
        opportunitiesData.push({ id: doc.id, ...doc.data() });
      });

      if (opportunitiesData.length > 0) {
        util.statusCode = 200;
        util.message = {
          opportunities: opportunitiesData,
          nextStartAfterId: opportunitiesData[opportunitiesData.length - 1].id,
        };
        return util.send(res);
      } else {
        util.statusCode = 404;
        util.message = "No opportunities found";
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
    const { user_id } = req.params;
    const { limit = 10, startAfter: startAfterId = null } = req.query;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    try {
      const opportunitiesData = [];
      let query = db
        .collection("opportunities")
        .where("user_id", "==", user_id)
        .limit(parseInt(limit));

      if (startAfterId) {
        const startAfterDoc = await db
          .collection("opportunities")
          .doc(startAfterId)
          .get();
        if (startAfterDoc.exists) {
          query = query.startAfter(startAfterDoc);
        } else {
          return res.status(400).json({ message: "Invalid startAfter ID" });
        }
      }

      const querySnapshot = await query.get();

      querySnapshot.forEach((doc) => {
        opportunitiesData.push({ id: doc.id, ...doc.data() });
      });

      if (opportunitiesData.length > 0) {
        return res.status(200).json({
          opportunities: opportunitiesData,
          nextStartAfterId: opportunitiesData[opportunitiesData.length - 1].id,
        });
      } else {
        return res.status(404).json({ message: "No opportunities found" });
      }
    } catch (error) {
      console.error("Error fetching opportunities by user ID:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  static async getOpportunityById(req, res) {
    const db = admin.firestore();
    const { opportunity_id } = req.params;

    if (!opportunity_id) {
      return res.status(400).json({ message: "Opportunity ID is required" });
    }

    try {
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
    const { status } = req.params;
    const { limit = 10, startAfter: startAfterId = null } = req.query;

    if (!status || !["open", "in_progress", "completed"].includes(status)) {
      util.statusCode = 400;
      util.message = "Invalid or missing opportunity status";
      return util.send(res);
    }

    try {
      const opportunitiesData = [];
      let query = db
        .collection("opportunities")
        .where("status", "==", status)
        .limit(parseInt(limit));

      if (startAfterId) {
        const startAfterDoc = await db
          .collection("opportunities")
          .doc(startAfterId)
          .get();
        if (startAfterDoc.exists) {
          query = query.startAfter(startAfterDoc);
        } else {
          util.statusCode = 400;
          util.message = "Invalid startAfter ID";
          return util.send(res);
        }
      }

      const querySnapshot = await query.get();

      querySnapshot.forEach((doc) => {
        opportunitiesData.push({ id: doc.id, ...doc.data() });
      });

      if (opportunitiesData.length > 0) {
        util.statusCode = 200;
        util.message = {
          opportunities: opportunitiesData,
          nextStartAfterId: opportunitiesData[opportunitiesData.length - 1].id,
        };
        return util.send(res);
      } else {
        util.statusCode = 404;
        util.message = "No opportunities found";
        return util.send(res);
      }
    } catch (error) {
      console.error("Error fetching opportunities by status:", error);
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
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
          updateData[field] = req.body[field];
        }
      });

      await opportunityRef.update(updateData);

      return res
        .status(200)
        .json({ message: "Opportunity updated successfully", statusCode: 200 });
    } catch (error) {
      console.log(error);
      console.error("Error updating opportunity:", error);
      return res
        .status(500)
        .json({ message: error?.message || "Server error", statusCode: 500 });
    }
  }

  static async createOpportunity(req, res, type) {
    const db = admin.firestore();
    try {
      const { user_id } = req.body;

      const userRef = db.collection("users").doc(user_id);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        util.statusCode = 404;
        util.message = "User not found";
        return util.send(res);
      }

      const userData = userDoc.data();

      if (
        userData.opportunities_posted_count >= userData.max_opportunities_posted
      ) {
        util.statusCode = 400;
        util.message = `You can only post up to ${userData.max_opportunities_posted} opportunities.`;
        return util.send(res);
      }

      const opportunity_id = uuidv4();

      const { ...opportunityData } = req.body;
      /* eslint-disable no-prototype-builtins */
      if (!req.body.hasOwnProperty("status")) {
        opportunityData.status = "open";
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

      // Include imageurl in opportunity data
      opportunityData.imageUrl = userData.imageUrl || null;

      console.log(userData);

      await db
        .collection("opportunities")
        .doc(opportunity_id)
        .set({
          opportunity_id,
          type,
          ...opportunityData,
        });

      await userRef.update({
        opportunities_posted_count: admin.firestore.FieldValue.increment(1),
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
