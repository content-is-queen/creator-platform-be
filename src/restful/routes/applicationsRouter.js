const { Router } = require("express");
const {
  ApplicationsController,
} = require("../controllers/applicationsController");

const router = Router();

// GET all applications
router.get("/", ApplicationsController.getAllApplications);

// GET all applications
router.get("/:opportunity_id", ApplicationsController.getAllApplicationsById);

// GET application by ID
router.get("/:application_id", ApplicationsController.getApplicationById);

// POST a new application
router.post("/", ApplicationsController.createApplication);

// PUT update an existing application
router.put("/:application_id", ApplicationsController.updateApplication);

// DELETE an application
router.delete("/:application_id", ApplicationsController.deleteApplication);

// Update application status
router.put(
  "/:opportunity_id/status",
  ApplicationsController.updateApplicationStatus,
);

module.exports.applicationsRouter = router;