import { Router } from "express";
import ApplicationController from '../controllers/applicationsControllers';

const router = Router();

// GET all applications
router.get('/', ApplicationController.getAllApplications);

// GET all applications
router.get('/:opportunity_id', ApplicationController.getAllApplicationsById);


// GET application by ID
router.get('/:application_id', ApplicationController.getApplicationById);

// POST a new application
router.post('/', ApplicationController.createApplication);

// PUT update an existing application
router.put('/:application_id', ApplicationController.updateApplication);

// DELETE an application
router.delete('/:application_id', ApplicationController.deleteApplication);

// Update application status
router.put('/:opportunity_id/status', ApplicationController.updateApplicationStatus);


module.exports = { router };