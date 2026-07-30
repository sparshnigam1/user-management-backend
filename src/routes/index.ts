import { Request, Response, Router } from "express";
import authRoutes from "./auth/auth.routes.js";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

router.use("/auth", authRoutes);

export default router;
