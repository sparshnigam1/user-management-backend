import { rolesController } from "@/controllers/roles/roles.controller.js";
import { authorize } from "@/middlewares/auth.js";
import { Router } from "express";

const rolesRoutes = Router();

rolesRoutes.get("/", authorize(), rolesController.list);
rolesRoutes.post("/create", authorize(), rolesController.create);
rolesRoutes.post("/:id/assign", authorize(), rolesController.assignRole);

export default rolesRoutes;
