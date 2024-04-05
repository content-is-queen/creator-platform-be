/* eslint-disable prettier/prettier */
import { Router } from "express";
// import protect from "../../middlewares";
import OpportunitiesController from "../controllers/OpportunitiesControllers";

const router = Router();

router.get("/", OpportunitiesController.getAllOpportunities);
router.get("/open", OpportunitiesController.getOpenOpportunities);
router.get("/in_progress", OpportunitiesController.getInProgressOpportunities);
router.get("/completed", OpportunitiesController.getCompletedOpportunities);


// GET endpoint to retrieve individual opportunity by ID
router.get("/:doc_type/:opportunity_id", OpportunitiesController.getOpportunityById);

// POST endpoint
// router.post("/", OpportunitiesController.createOpportunity);

// POST endpoint for creating opportunities
router.post("/", async (req, res) => {
    const { type } = req.body;
    if (!type || !['job', 'pitch', 'campaign'].includes(type)) {
      return res.status(400).json({ message: "Invalid or missing opportunity type" });
    }
  
    try {
      switch (type) {
        case 'job':
          return OpportunitiesController.createJobOpportunity(req, res);
        case 'pitch':
          return OpportunitiesController.createPitchOpportunity(req, res);
        case 'campaign':
          return OpportunitiesController.createCampaignOpportunity(req, res);
        default:
          return res.status(400).json({ message: "Invalid opportunity type" });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  
//DELETE endpoint
router.delete("/:doc_type/:opportunity_id", OpportunitiesController.deleteOpportunityById); // New route for delete

//UPDATE endpoint
router.put("/:doc_type/:opportunity_id", OpportunitiesController.updateOpportunityById); // New route for update

module.exports = { router };
