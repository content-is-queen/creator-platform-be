const admin = require("firebase-admin");
const { Util } = require("./utils");

const util = new Util();

const checkSubscribedUser = () => {
  return async (req, res, next) => {
    const db = admin.firestore();
    const userRole = req.user.role;
    const limitsRef = db.collection("settings").doc("limits");
    if (userRole === "admin" || userRole === "super_admin") {
      return next();
    } else if (req.user.subscribed) {
      return next();
    } else if (userRole === "brand") {
      const numberOfOpportunitiesAllowedSnapshot = await limitsRef.get();
      const { numberOfOpportunitiesAllowed } =
        numberOfOpportunitiesAllowedSnapshot.data();
      const { opportunitiesPostedCount } = req.body;
      if (opportunitiesPostedCount > numberOfOpportunitiesAllowed) {
        util.statusCode = 403;
        util.message =
          "Number of opportunities allowed for unpaid accounts has been reached";
        return util.send(res);
      } else {
        return next();
      }
    } else if (userRole === "creator") {
      const numberOfApplicationsAllowedSnapshot = await limitsRef.get();
      const { numberOfApplicationsAllowed } =
        numberOfApplicationsAllowedSnapshot.data();
      const { opportunitiesAppliedCount } = req.body;
      if (opportunitiesAppliedCount > numberOfApplicationsAllowed) {
        util.statusCode = 403;
        util.message =
          "Number of applications allowed for unpaid accounts has been reached";
        return util.send(res);
      } else {
        return next();
      }
    } else {
      util.statusCode = 400;
      util.message = "You are not allowed to perform this action";
      return util.send(res);
    }
  };
};
module.exports = checkSubscribedUser;
