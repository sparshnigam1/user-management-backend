import { HttpStatus } from "@/lib/http/status.js";
import { ModulesModel } from "@/models/modules.model.js";
import { Request, Response } from "express";
import {
  CreateBulkModuleRequestBody,
  createBulkModuleSchema,
  createModuleSchema,
  createUserRequestBody,
  getModuleByIdParamsSchema,
  updateModuleRequestBody,
  updateModuleSchema,
  updateModuleStatusRequestBody,
  updateModuleStatusSchema,
} from "./schema.js";

export const modulesController = {
  async listAll(req: Request, res: Response): Promise<void> {
    try {
      const modules = await ModulesModel.findAll();

      if (!modules) {
        res
          .status(HttpStatus.BAD_REQUEST)
          .json({ status: false, message: "failed to list modules" });
      }

      res
        .status(HttpStatus.OK)
        .json({ message: "request successfull", modules });
    } catch (error: any) {
      console.error(error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Something went wrong during login" });
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    try {
      const result = createModuleSchema.safeParse(req.body);

      if (!result.success) {
        res.status(HttpStatus.BAD_REQUEST).json({
          message: "Validation failed",
          errors: result.error.flatten().fieldErrors,
        });
        return;
      }

      const input: createUserRequestBody = result.data;

      const module = await ModulesModel.create(input);

      res
        .status(HttpStatus.CREATED)
        .json({ message: "Module created successfully", module });
    } catch (error: any) {
      console.error(error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Something went wrong while creating the module" });
    }
  },

  async bulkCreate(req: Request, res: Response): Promise<void> {
    try {
      const result = createBulkModuleSchema.safeParse(req.body);

      if (!result.success) {
        res.status(HttpStatus.BAD_REQUEST).json({
          message: "Validation failed",
          errors: result.error.flatten().fieldErrors,
        });

        return;
      }

      const input: CreateBulkModuleRequestBody = result.data;

      const modules = await ModulesModel.bulkCreate(
        input.parent_id,
        input.module,
      );

      res.status(HttpStatus.CREATED).json({
        message: "Modules created successfully",
        count: modules.length,
        modules,
      });
    } catch (error) {
      console.error(error);

      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Something went wrong while creating modules",
      });
    }
  },

  async details(req: Request, res: Response): Promise<void> {
    try {
      const result = getModuleByIdParamsSchema.safeParse(req.params);

      if (!result.success) {
        res.status(400).json({
          message: "Validation failed",
          errors: result.error.flatten().fieldErrors,
        });
        return;
      }

      const { id } = req.params;

      const module = await ModulesModel.findOne({ id: id as string });

      if (!module) {
        res.status(404).json({
          status: false,
          message: `Module with ID ${id} not found`,
          path: `/users/${id}`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(200).json({ message: "request successfull", module });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  async update(req: Request, res: Response): Promise<void> {
    const reqID = getModuleByIdParamsSchema.safeParse(req.params);

    if (!reqID.success) {
      res.status(400).json({
        message: "Invalid Module Id",
        errors: reqID.error.flatten().fieldErrors,
      });
      return;
    }

    const result = updateModuleSchema.safeParse(req.body);

    if (!result.success) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    const { id } = req.params;

    const module = await ModulesModel.findOne({
      id: id as string,
    });

    if (!module) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message: "Module not found",
      });
      return;
    }

    const input: updateModuleRequestBody = result.data;

    const updatedUser = await ModulesModel.update(module.id, {
      ...input,
    });

    if (!updatedUser) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Something went wrong. Unable to update user.",
      });
      return;
    }

    res
      .status(HttpStatus.CREATED)
      .json({ message: "Module updated successfully", user: updatedUser });
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    const reqID = getModuleByIdParamsSchema.safeParse(req.params);

    if (!reqID.success) {
      res.status(400).json({
        message: "Invalid Module Id",
        errors: reqID.error.flatten().fieldErrors,
      });
      return;
    }

    const result = updateModuleStatusSchema.safeParse(req.body);

    if (!result.success) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    const { id } = req.params;

    const module = await ModulesModel.findOne({
      id: id as string,
    });

    if (!module) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message: "Module not found",
      });
      return;
    }

    const input: updateModuleStatusRequestBody = result.data;

    const updatedUser = await ModulesModel.update(module.id, {
      status: input.status,
    });

    if (!updatedUser) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Something went wrong. Unable to update user status.",
      });
      return;
    }

    res
      .status(HttpStatus.CREATED)
      .json({ message: "Module status updated successfully", module });
  },

  async delete(req: Request, res: Response): Promise<void> {
    const reqID = getModuleByIdParamsSchema.safeParse(req.params);

    if (!reqID.success) {
      res.status(400).json({
        message: "Invalid Module Id",
        errors: reqID.error.flatten().fieldErrors,
      });
      return;
    }

    const { id } = req.params;

    const module = await ModulesModel.findOne({
      id: id as string,
    });

    if (!module) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message: "Module not found",
      });
      return;
    }

    const deletedModule = await ModulesModel.delete(module.id);

    if (!deletedModule) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Something went wrong. Unable to delete user.",
      });
      return;
    }

    res
      .status(HttpStatus.CREATED)
      .json({ message: "Module deleted successfully", user: deletedModule });
  },
};
