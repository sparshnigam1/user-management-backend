import { modulesController } from "@/controllers/modules/modules.controller.js";
import { asyncHandler } from "@/middlewares/asyncHandler.js";
import { authorize } from "@/middlewares/auth.js";
import { Router } from "express";

const moduleRoutes = Router();

moduleRoutes.get("/", asyncHandler(modulesController.listAll));
moduleRoutes.post("/create", asyncHandler(modulesController.create));
moduleRoutes.post("/bulk-create", asyncHandler(modulesController.bulkCreate));
moduleRoutes.get("/:id", asyncHandler(modulesController.details));
moduleRoutes.put(
  "/:id/update-status",
  asyncHandler(modulesController.updateStatus),
);
moduleRoutes.patch(
  "/:id/update",
  authorize({ isRoleBased: true }),
  asyncHandler(modulesController.update),
);
moduleRoutes.delete(
  "/:id/delete",
  authorize({ isRoleBased: true }),
  asyncHandler(modulesController.delete),
);

export default moduleRoutes;
