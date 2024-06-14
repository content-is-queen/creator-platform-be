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
router.post("/emailupdate", protect, AuthController.changeEmail);
router.get("/user/:userId", AuthController.getPublicUser);
router.get("/check-email", AuthController.checkEmailExists);

router.put(
  "/subscription/:userId",
  protect,
  AuthController.updateUserSubscription,
);
router.get("/subscription/:userId", protect, AuthController.checkSubscription);

module.exports.authRouter = router;
