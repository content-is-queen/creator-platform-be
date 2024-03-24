/* eslint-disable quotes */
import dotenv from "dotenv";
import Util from "../../helper/utils";
const { v4: uuidv4 } = require("uuid");
const admin = require("firebase-admin");

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
  static async newOpportunities(req, res) {
    const { title, description, type, deadline, budget } = req.body;
    const db = admin.firestore();
    const documentId = "open";
    const newOpportunityId = uuidv4();
    const newData = {
      title,
      description,
      type,
      deadline,
      budget,
      opportunity_id: newOpportunityId,
      user_id: req.user.user_id,
      createdAt: new Date().toISOString().substring(0, 19),
      updatedAt: new Date().toISOString().substring(0, 19),
    };

    db.collection("opportunities")
      .doc(documentId)
      .get()
      .then((doc) => {
        if (doc.exists) {
          const data = doc.data();
          if (
            data.data.some((item) => item.opportunity_id === newOpportunityId)
          ) {
            util.statusCode = 409;
            util.message = `Opportunity with ID '${newOpportunityId}' already exists.`;
            return util.send(res);
          }
        }
        db.collection("opportunities")
          .doc(documentId)
          .update({
            data: admin.firestore.FieldValue.arrayUnion(newData),
          })
          .then(() => {
            util.statusCode = 200;
            util.message = "New opportunity created successfully";
            return util.send(res);
          })
          .catch((error) => {
            util.statusCode = 500;
            util.message = error.message || "Server error";
            return util.send(res);
          });
      })
      .catch((error) => {
        util.statusCode = 500;
        util.message = error.message || "Server error";
        return util.send(res);
      });
  }

  static async getAllOpportunities(req, res) {
    const db = admin.firestore();
    try {
      const opportunitiesCollectionRef = db.collection("opportunities");
      const opportunitiesSnapshot = await opportunitiesCollectionRef.get();

      const opportunities = [];
      opportunitiesSnapshot.forEach((opportunitiesDoc) => {
        const opportunitiesData = opportunitiesDoc.data().data;
        const status = opportunitiesDoc.id;
        opportunities.push({ ...opportunitiesData, status });
      });

      if (opportunities.length > 0) {
        util.statusCode = 200;
        util.message = opportunities;
        return util.send(res);
      } else {
        util.statusCode = 404;
        util.message = "No opportunities found.";
        return util.send(res);
      }
    } catch (error) {
      util.statusCode = 500;
      util.message = error.message || "Server error";
      return util.send(res);
    }
  }
}

export default OpportunitiesController;
