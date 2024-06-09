const { Router } = require("express");
const { AdminController } = require("../controllers/adminController");
const { protect } = require("../../middleware/index");
const allowedRole = require("../../helper/allowedRole");

const router = Router();

router.post(
  "/users",
  protect,
  allowedRole(["admin", "super_admin"]),
  AdminController.adminCreateUser,
);
router.get("/users", AdminController.admingetAllUsers);
router.get(
  "/info",
  protect,
  allowedRole(["admin", "super_admin"]),
  AdminController.adminGetInfo,
);
router.put(
  "/activate/:user_id",
  protect,
  allowedRole(["admin", "super_admin"]),
  AdminController.adminActivateUser,
);
router.put(
  "/deactivate/:user_id",
  protect,
  allowedRole(["admin", "super_admin"]),
  AdminController.adminDeActivateUser,
);
router.delete(
  "/delete/:user_id",
  protect,
  allowedRole(["admin", "super_admin"]),
  AdminController.adminDeleteUser,
);

// New route to update user limits
router.patch(
  "/updateUserLimits/:user_id",
  protect,
  allowedRole(["super_admin"]),
  AdminController.adminUpdateUserLimits,
);
router.get("/opportunities", AdminController.getAllOpportunities);
router.get("/company", AdminController.getCompanyInfo);
router.put("/company", AdminController.updateCompanyInfo);

module.exports.adminRouter = router;
