import { userController } from "@/controllers/user/user.controller.js";
import { asyncHandler } from "@/middlewares/asyncHandler.js";
import { authorize } from "@/middlewares/auth.js";
import { Router } from "express";

const userRoutes = Router();

userRoutes.post("/create", asyncHandler(userController.create));
userRoutes.get("/", authorize(), asyncHandler(userController.listAll));
userRoutes.get("/:id", asyncHandler(userController.getUserById));
userRoutes.put("/:id/update-status", asyncHandler(userController.updateStatus));
userRoutes.patch(
  "/:id/update",
  authorize(),
  asyncHandler(userController.update),
);
userRoutes.delete(
  "/:id/delete",
  authorize(),
  asyncHandler(userController.softDelete),
);

export default userRoutes;
