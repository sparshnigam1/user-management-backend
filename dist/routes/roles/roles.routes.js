import { rolesController } from "@/controllers/roles.controller.js";
import { Router } from "express";
const rolesRoutes = Router();
rolesRoutes.get("/", rolesController.list);
export default rolesRoutes;
//# sourceMappingURL=roles.routes.js.map