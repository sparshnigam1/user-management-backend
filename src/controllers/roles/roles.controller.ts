import { HttpStatus } from "@/lib/http/status.js";
import { RolesModel } from "@/models/roles.model.js";
import { Request, Response } from "express";
import {
  assignRoleSchema,
  createRoleRequestBody,
  createRoleSchema,
  getRoleByIdParamsSchema,
} from "./schema.js";

export const rolesController = {
  async list(req: Request, res: Response) {
    try {
      const { user }: any = req.session;

      const roles = await RolesModel.findVisibleRoles(user);

      if (!roles) {
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: "Something went wrong during fetching roles" });
      }
      if (!!roles && roles?.length) {
        res.status(HttpStatus.OK).json({ status: "ok", data: roles });
      }
    } catch (error: any) {
      console.error(error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Something went wrong" });
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const result = createRoleSchema.safeParse(req.body);

      if (!result.success) {
        res.status(HttpStatus.BAD_REQUEST).json({
          message: "Validation failed",
          errors: result.error.flatten().fieldErrors,
        });

        return;
      }

      const { name, description }: createRoleRequestBody = result.data;

      const { user, role }: any = req.session;

      const createdRole = await RolesModel.create({
        name,
        description,
        userId: user,
        parentId: role,
      });

      res.status(HttpStatus.CREATED).json({
        success: true,
        data: createdRole,
      });
    } catch (error: any) {
      console.error(error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Something went wrong" });
    }
  },

  async assignRole(req: Request, res: Response): Promise<void> {
    try {
      const { user }: any = req.session;

      const result = getRoleByIdParamsSchema.safeParse(req.params);
      const reqBodyresult = assignRoleSchema.safeParse(req.body);

      if (!result.success) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: "Validation failed",
          errors: result.error.flatten().fieldErrors,
        });
        return;
      }

      if (!reqBodyresult.success) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: "Validation failed",
          errors: reqBodyresult.error.flatten().fieldErrors,
        });
        return;
      }

      const { id: roleId } = result.data;
      const { assign_to } = reqBodyresult.data;

      await RolesModel.assignRoleToUser({
        roleId,
        userId: assign_to,
        assignedBy: user,
      });

      res.status(HttpStatus.OK).json({
        success: true,
        message: "Role assigned successfully",
      });
    } catch (error) {
      console.error("Assign role error:", error);

      const message =
        error instanceof Error ? error.message : "Failed to assign role";

      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message,
      });
    }
  },
};
