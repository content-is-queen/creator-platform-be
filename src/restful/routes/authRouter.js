const { Router } = require("express");
const { AuthController } = require("../controllers/authController");
const { protect } = require("../../middlewares");

const router = Router();

router.get("/user", protect, AuthController.getUser);
router.get("/users", AuthController.getAllUsers);
router.post("/signup", AuthController.signup);
router.patch("/user", protect, AuthController.updateUser);
router.post("/verify", AuthController.verifyOtp);
router.post("/reset", AuthController.resetUserPassword);

// New route for fetching non-sensitive user profile data
router.get("/user/:user_id", AuthController.getPublicUser);

module.exports.authRouter = router;
