import { rolesController } from "@/controllers/roles.controller.js";
import { authorize } from "@/middlewares/auth.js";
import { Router } from "express";

const rolesRoutes = Router();

rolesRoutes.get("/", authorize(), rolesController.list);

export default rolesRoutes;
