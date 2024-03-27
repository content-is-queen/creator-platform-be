/* eslint-disable prettier/prettier */
import { Router } from "express";
import protect from "../../middlewares";
import OpportunitiesController from "../controllers/OpportunitiesControllers";

const router = Router();

router.get("/", OpportunitiesController.getAllOpportunities);
router.get("/open", OpportunitiesController.getOpenOpportunities);
router.get("/in_progress", OpportunitiesController.getInProgressOpportunities);
router.get("/completed", OpportunitiesController.getCompletedOpportunities);


// GET endpoint to retrieve individual opportunity by ID
router.get("/:doc_type/:opportunity_id", OpportunitiesController.getOpportunityById);

// POST endpoint
router.post("/", OpportunitiesController.createOpportunity);

//DELETE endpoint
router.delete("/:doc_type/:opportunity_id", OpportunitiesController.deleteOpportunityById); // New route for delete

//UPDATE endpoint
router.put("/:doc_type/:opportunity_id", OpportunitiesController.updateOpportunityById); // New route for update

module.exports = { router };
