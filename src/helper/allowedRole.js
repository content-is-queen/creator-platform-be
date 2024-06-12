const { Util } = require("./utils");

const util = new Util();

const allowedRole = (roles) => {
  return (req, res, next) => {
    const userRole = req?.user?.role;
    if (roles.includes(userRole) || req.user.email === process.env.EMAIL) {
      next();
    } else {
      util.statusCode = 400;
      util.message = "You are not allowed to perform this action";
      return util.send(res);
    }
  };
};
module.exports = allowedRole;
