const { Router } = require("express");
const { AuthController } = require("../controllers/authController");
const { protect } = require("../../middleware");

const router = Router();

router.get("/user", protect, AuthController.getUser);
router.put("/user", protect, AuthController.updateUser);

router.get("/users", AuthController.getAllUsers);
router.post("/signup", AuthController.signup);
router.post("/verify", AuthController.verifyOtp);
router.post("/reset", AuthController.resetUserPassword);
router.post("/username", protect, AuthController.createUsername);
router.post("/password", protect, AuthController.changePassword);
router.get("/user/:user_id", AuthController.getPublicUser);

// Define the route to add an episode to the user's credits
router.post("/add-episode-to-credits", protect, AuthController.addEpisodeToCredits);

module.exports.authRouter = router;
