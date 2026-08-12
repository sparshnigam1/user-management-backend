import { userController } from "@/controllers/user/user.controller.js";
import { asyncHandler } from "@/middlewares/asyncHandler.js";
import { Router } from "express";

const userRoutes = Router();

userRoutes.post("/create", asyncHandler(userController.create));
userRoutes.get("/", asyncHandler(userController.listAll));
userRoutes.get("/:id", asyncHandler(userController.getUserById));

export default userRoutes;
