/* eslint-disable prettier/prettier */
import { Router } from "express";
import protect from "../../middlewares";
import OpportunitiesController from "../controllers/OpportunitiesControllers";

const router = Router();

router.get("/",protect, OpportunitiesController.getAllOpportunities);
router.post("/",protect, OpportunitiesController.newOpportunities);

module.exports = { router };
