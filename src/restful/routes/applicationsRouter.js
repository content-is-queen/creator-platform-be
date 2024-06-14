const { Router } = require("express");
const {
  ApplicationsController,
} = require("../controllers/applicationsController");

const router = Router();

// GET all applications
router.get("/", ApplicationsController.getAllApplications);

// GET applications by opportunity ID
router.get(
  "/opportunity/:opportunityId",
  ApplicationsController.getAllApplicationsById,
);

// GET application by ID
router.get("/:applicationId", ApplicationsController.getApplicationById);

// POST a new application
router.post("/", ApplicationsController.createApplication);

// PATCH update an existing application
router.patch("/:applicationId", ApplicationsController.updateApplication);

// DELETE an application
router.delete("/:applicationId", ApplicationsController.deleteApplication);

module.exports.applicationsRouter = router;
