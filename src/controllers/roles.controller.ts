import { RolesModel } from "@/models/roles.model.js";
import { Request, Response } from "express";

export const rolesController = {
  async list(req: Request, res: Response) {
    try {
      const roles = await RolesModel.list();
      if (!roles) {
        res
          .status(500)
          .json({ message: "Something went wrong during fetching roles" });
      }
      if (!!roles && roles?.length) {
        res.status(201).json({ status: "ok", roles });
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "Something went wrong" });
    }
  },
};
