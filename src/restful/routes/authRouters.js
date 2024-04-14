/* eslint-disable prettier/prettier */
const { Router } = require("express");
const AuthController = require("../controllers/authControllers");
const protect = require("../../middlewares");

const router = Router();

router.get("/profile",protect, AuthController.profile);
router.post("/signup/brand", AuthController.signupBrand);
router.post("/signup/creator", AuthController.signupCreator);
router.patch("/profile",protect, AuthController.updateProfile);
router.post("/verify", AuthController.verifyOtp);

module.exports = { router };