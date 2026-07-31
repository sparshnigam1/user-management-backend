import { userController } from "@/controllers/user/user.controller.js";
import { Router } from "express";

const userRoutes = Router();

userRoutes.get("/", userController.listAll);
userRoutes.get("/:id", userController.getUserById);

export default userRoutes;
