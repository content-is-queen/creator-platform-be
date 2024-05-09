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
router.get("/user/:user_id", AuthController.getPublicUser);
router.delete("/users/:user_id", protect, AuthController.deleteUser); // New route added for deleting user account


module.exports.authRouter = router;