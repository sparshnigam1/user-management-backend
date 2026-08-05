import { authController } from "@/controllers/auth/auth.controller.js";
import { asyncHandler } from "@/middlewares/asyncHandler.js";
import { Router } from "express";

const authRoutes = Router();

authRoutes.post("/signup", asyncHandler(authController.signup));
authRoutes.post("/login", asyncHandler(authController.login));
authRoutes.get("/logout", asyncHandler(authController.logout));

export default authRoutes;
