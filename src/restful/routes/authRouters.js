/* eslint-disable prettier/prettier */
import { Router } from "express";
import AuthController from "../controllers/authControllers";
import protect from "../../middlewares";

const router = Router();

router.get("/profile",protect, AuthController.profile);
router.post("/signup/brand", AuthController.signupBrand);
router.post("/signup/creator", AuthController.signupCreator);
router.patch("/profile",protect, AuthController.updateProfile);
router.post("/verify", AuthController.verifyOtp);

module.exports = { router };