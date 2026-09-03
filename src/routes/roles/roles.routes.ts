import { rolesController } from "@/controllers/roles/roles.controller.js";
import { asyncHandler } from "@/middlewares/asyncHandler.js";
import { authorize } from "@/middlewares/auth.js";
import { Router } from "express";

const rolesRoutes = Router();

rolesRoutes.get("/", authorize(), asyncHandler(rolesController.list));
rolesRoutes.post("/create", authorize(), asyncHandler(rolesController.create));
rolesRoutes.post(
  "/:id/assign",
  authorize(),
  asyncHandler(rolesController.assignRole),
);
rolesRoutes.patch(
  "/:id/update",
  authorize(),
  asyncHandler(rolesController.update),
);
rolesRoutes.put(
  "/:id/update-status",
  authorize(),
  asyncHandler(rolesController.updateStatus),
);

export default rolesRoutes;
