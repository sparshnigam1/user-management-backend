import { authController } from "@/controllers/auth/auth.controller.js";
import { asyncHandler } from "@/middlewares/asyncHandler.js";
import { Router } from "express";
const authRoutes = Router();
authRoutes.post("/signup", asyncHandler(authController.signup));
authRoutes.post("/login", asyncHandler(authController.login));
authRoutes.get("/logout", asyncHandler(authController.logout));
authRoutes.post("/forget-password", asyncHandler(authController.forgetPassword));
authRoutes.post("/verify-otp", asyncHandler(authController.verifyForgetPassOTP));
authRoutes.post("/reset-password", asyncHandler(authController.resetPassword));
export default authRoutes;
//# sourceMappingURL=auth.routes.js.map