/* eslint-disable quotes */
import dotenv from "dotenv";
import Util from "../../helper/utils";
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

  static async getAllOpportunities(req, res) {
    // const { uid } = req.user;
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
        // console.log("opportunities found:", opportunities);
        // console.log("Total number of opportunities:", opportunities.length);
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
