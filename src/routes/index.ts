import { authenticate, authorize } from "@/middlewares/auth.js";
import crypto from "crypto";
import { Request, Response, Router } from "express";
import authRoutes from "./auth/auth.routes.js";
import moduleRoutes from "./modules/modules.route.js";
import rolesRoutes from "./roles/roles.routes.js";
import userRoutes from "./users/users.routes.js";

const router = Router();

const secret = crypto.randomBytes(32).toString("hex");
router.get("/", (_req: Request, res: Response) => {
  res
    .status(200)
    .json({ status: "ok", timestamp: new Date().toISOString(), secret });
});

router.use("/auth", authRoutes);
router.use("/roles", authenticate, authorize(), rolesRoutes);
router.use("/users", authenticate, authorize(), userRoutes);
router.use("/modules", authenticate, authorize(), moduleRoutes);

export default router;
