const { Router } = require("express");
const {
  ApplicationsController,
} = require("../controllers/applicationsController");

const router = Router();

// GET all applications
router.get("/", ApplicationsController.getAllApplications);

// GET applications by opportunity ID
router.get(
  "/opportunity/:opportunity_id",
  ApplicationsController.getAllApplicationsById,
);

// GET application by ID
router.get("/:application_id", ApplicationsController.getApplicationById);

// POST a new application
router.post("/", ApplicationsController.createApplication);

// PATCH update an existing application
router.put("/:application_id", ApplicationsController.updateApplication);

// DELETE an application
router.delete("/:application_id", ApplicationsController.deleteApplication);

module.exports.applicationsRouter = router;
