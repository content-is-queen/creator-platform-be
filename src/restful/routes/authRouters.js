/* eslint-disable prettier/prettier */
import { Router } from "express";
import AuthController from "../controllers/authControllers";
import protect from "../../middlewares";

const router = Router();

router.get("/profile",protect, AuthController.profile);

module.exports = { router };
