const admin = require("firebase-admin");
const { Util } = require("../helper/utils");
const util = new Util();
const protect = async (req, res, next) => {
  if (!req.headers.authorization) {
    util.setError(401, "Token not found");
    return util.send(res);
  }

  let token;

  try {
    token = req.headers.authorization.split(" ")[1];

    const decodedToken = await admin.auth().verifyIdToken(token);

    if (!decodedToken) {
      return res.status(401).json({ error: "Not Authenticated!" });
    }
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Not Authorized!" });
  }
};
exports.protect = protect;
