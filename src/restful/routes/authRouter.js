const { Router } = require("express");
const { AuthController } = require("../controllers/authController");
const { protect } = require("../../middlewares");

const router = Router();

router.get("/profile", protect, AuthController.profile);
router.post("/signup/brand", AuthController.signupBrand);
router.post("/signup/creator", AuthController.signupCreator);
router.patch("/profile", protect, AuthController.updateProfile);

// New route for fetching non-sensitive user profile data
router.get("/profile/:role/:userId", AuthController.getNonSensitiveProfile);

module.exports.authRouter = router;
