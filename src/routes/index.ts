import { Request, Response, Router } from "express";
import authRoutes from "./auth/auth.routes.js";
import rolesRoutes from "./roles/roles.routes.js";
import userRoutes from "./users/users.routes.js";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

router.use("/auth", authRoutes);
router.use("/roles", rolesRoutes);
router.use("/users", userRoutes);

export default router;
