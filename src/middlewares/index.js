const admin = require("firebase-admin");
const { Util } = require("../helper/utils");
const util = new Util();
const protect = async (req, res, next) => {
  let token;
  if (!req.headers.authorization) {
    util.setError(401, "Token not found");
    return util.send(res);
  }
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      const refreshedUser = await admin.auth().getUser(decodedToken.uid, true);
      console.log(refreshedUser, "Refleshed user .......");
      req.user = decodedToken;
      next();
    } catch (error) {
      return res.status(401).json({ error: "Not Authorized!" });
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Not Authenticated!" });
  }
};
exports.protect = protect;
