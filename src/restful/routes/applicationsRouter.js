const { Router } = require("express");
const {
  ApplicationsController,
} = require("../controllers/applicationsController");
const { protect } = require("../../middleware");
const checkSubscribedUser = require("../../helper/checkSubscribedUser");

const router = Router();

// GET all applications
router.get("/", ApplicationsController.getAllApplications);

// GET applications by opportunity ID
router.get(
  "/opportunity/:opportunityId",
  ApplicationsController.getAllApplicationsById,
);

// GET applications by user ID
router.get("/user/:userId", ApplicationsController.getApplicationsByUserId);

// GET application by ID
router.get("/:applicationId", ApplicationsController.getApplicationById);

// POST a new application
router.post(
  "/",
  protect,
  checkSubscribedUser(),
  ApplicationsController.createApplication,
);

// PATCH update an existing application
router.patch("/:applicationId", ApplicationsController.updateApplication);

// DELETE an application
router.delete("/:applicationId", ApplicationsController.deleteApplication);

module.exports.applicationsRouter = router;
