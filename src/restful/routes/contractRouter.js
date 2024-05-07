// contractRoutes.js
const { Router } = require("express");
const { ContractController } = require("../controllers/contractController");
const router = Router();

const rateLimit = require('express-rate-limit');

// Define rate limiting options
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Max 5 requests per minute
  message: "Too many requests from this IP, please try again later."
});

// Apply rate limiting middleware to all routes in the applications router
router.use(limiter);

router.post("/", ContractController.createContract);
router.get("/:contract_id", ContractController.getContractById);
router.put("/:contract_id", ContractController.updateContractById);
router.delete("/:contract_id", ContractController.deleteContractById);

router.get("/", ContractController.getAllContracts);

module.exports.contractRouter = router; // Export the router directly
