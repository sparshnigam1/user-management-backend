import { authController } from "@/controllers/auth.controller.js";
import { asyncHandler } from "@/middlewares/asyncHandler.js";
import { Router } from "express";

const authRoutes = Router();

authRoutes.post("/signup", asyncHandler(authController.signup));
authRoutes.post("/login", asyncHandler(authController.login));

export default authRoutes;
