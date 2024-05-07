const { Router } = require("express");
const { ApplicationsController } = require("../controllers/applicationsController");
const rateLimit = require('express-rate-limit');

const router = Router();

// Define rate limiting options
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Max 5 requests per minute
  message: "Too many requests from this IP, please try again later."
});

// Apply rate limiting middleware to all routes in the applications router
router.use(limiter);

// GET all applications
router.get("/", ApplicationsController.getAllApplications);

// GET applications by opportunity ID
router.get("/opportunity/:opportunity_id", ApplicationsController.getAllApplicationsById);

// GET application by ID
router.get("/:application_id", ApplicationsController.getApplicationById);

// POST a new application
router.post("/", ApplicationsController.createApplication);

// PUT update an existing application
router.put("/:application_id", ApplicationsController.updateApplication);

// DELETE an application
router.delete("/:application_id", ApplicationsController.deleteApplication);

module.exports.applicationsRouter = router;
