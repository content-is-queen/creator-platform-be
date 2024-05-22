const { Router } = require("express");
const { AuthController } = require("../controllers/authController");
const { protect } = require("../../middleware");

const router = Router();

router.get("/user", protect, AuthController.getUser);
router.put("/user", protect, AuthController.updateUser);

router.get("/users", AuthController.getAllUsers);
router.post("/signup", AuthController.signup);
router.post("/verify", AuthController.verifyOtp);
router.post("/forgot", AuthController.forgetPassword);
router.post("/reset", AuthController.resetUserPassword);
router.post("/password", protect, AuthController.changePassword);
router.get("/user/:user_id", AuthController.getPublicUser);

module.exports.authRouter = router;
