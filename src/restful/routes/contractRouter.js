// contractRoutes.js
const { Router } = require("express");
const { ContractController } = require("../controllers/contractController");
const router = Router();

router.post("/", ContractController.createContract);
router.get("/:contractId", ContractController.getContractById);
router.put("/:contractId", ContractController.updateContractById);
router.delete("/:contractId", ContractController.deleteContractById);

router.get("/", ContractController.getAllContracts);

module.exports.contractRouter = router; // Export the router directly
