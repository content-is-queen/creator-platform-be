// contractRoutes.js
const { Router } = require("express");
const { ContractController } = require("../controllers/contractController");
const router = Router();

router.post("/", ContractController.createContract);
router.get("/:contract_id", ContractController.getContractById);
router.put("/:contract_id", ContractController.updateContractById);
router.delete("/:contract_id", ContractController.deleteContractById);

router.get("/", ContractController.getAllContracts);

module.exports.contractRouter = router; // Export the router directly
