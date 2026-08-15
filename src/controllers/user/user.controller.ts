import { hashPassword } from "@/helpers/authHelper.js";
import { HttpStatus } from "@/lib/http/status.js";
import { USER_STATUS } from "@/lib/types/user.js";
import { ROLES_ENUM, RolesModel } from "@/models/roles.model.js";
import { UserModel } from "@/models/users.model.js";
import { Request, Response } from "express";
import {
  createUserRequestBody,
  createUserSchema,
  getUserByIdParamsSchema,
  updateUserRequestBody,
  updateUserSchema,
  updateUserStatusRequestBody,
  updateUserStatusSchema,
} from "./schema.js";

export const userController = {
  async listAll(req: Request, res: Response): Promise<void> {
    try {
      const users = await UserModel.conditionalFindAll({
        not: { status: USER_STATUS.INACTIVE },
      });

      if (!users) {
        res
          .status(400)
          .json({ status: false, message: "find all users query failed" });
      }

      const parsedUser = users?.map((user) => ({
        id: user?.id,
        role_id: user?.role_id,
        first_name: user?.first_name,
        last_name: user?.last_name,
        email_id: user?.email_id,
        phone_number: user?.phone_number,
        gender: user?.gender,
        created_at: user?.created_at,
        updated_at: user?.updated_at,
        status: user?.status,
      }));

      res
        .status(200)
        .json({ message: "request successfull", users: parsedUser });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "Something went wrong during login" });
    }
  },

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const result = getUserByIdParamsSchema.safeParse(req.params);

      if (!result.success) {
        res.status(400).json({
          message: "Validation failed",
          errors: result.error.flatten().fieldErrors,
        });
        return;
      }

      const { id } = req.params;

      const user = await UserModel.findOne({ id: id as string });

      if (!user) {
        res.status(404).json({
          status: false,
          message: `User with ID ${id} not found`,
          path: `/users/${id}`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const parsedUser = {
        id: user?.id,
        role_id: user?.role_id,
        first_name: user?.first_name,
        last_name: user?.last_name,
        email_id: user?.email_id,
        phone_number: user?.phone_number,
        gender: user?.gender,
        created_at: user?.created_at,
        updated_at: user?.updated_at,
        status: user?.status,
      };

      res
        .status(200)
        .json({ message: "request successfull", users: parsedUser });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    const result = createUserSchema.safeParse(req.body);

    if (!result.success) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    const input: createUserRequestBody = result.data;

    const roles = await RolesModel.list();
    const customerRole = roles.find(({ name }) => name === ROLES_ENUM.CUSTOMER);
    if (!customerRole) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Customer role is not configured" });
      return;
    }

    const hashedPassword = input.password
      ? await hashPassword(input.password)
      : undefined;
    const userFormattedReqBody = {
      ...input,
      password: hashedPassword,
      role_id: input?.role_id || customerRole.id,
    };
    const user = await UserModel.create(userFormattedReqBody);

    res
      .status(HttpStatus.CREATED)
      .json({ message: "User created successfully", user });
  },

  async update(req: Request, res: Response): Promise<void> {
    const reqID = getUserByIdParamsSchema.safeParse(req.params);

    if (!reqID.success) {
      res.status(400).json({
        message: "Invalid User Id",
        errors: reqID.error.flatten().fieldErrors,
      });
      return;
    }

    const result = updateUserSchema.safeParse(req.body);

    if (!result.success) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    const { id } = req.params;

    const user = await UserModel.findOne({
      id: id as string,
    });

    if (!user) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message: "User not found",
      });
      return;
    }

    const input: updateUserRequestBody = result.data;

    const hashedPassword = input.password
      ? await hashPassword(input.password)
      : undefined;

    const updatedUser = await UserModel.update(user.id, {
      ...input,
      ...(!!input.password ? { password: hashedPassword } : {}),
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
      .json({ message: "User updated successfully", user: updatedUser });
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    const reqID = getUserByIdParamsSchema.safeParse(req.params);

    if (!reqID.success) {
      res.status(400).json({
        message: "Invalid User Id",
        errors: reqID.error.flatten().fieldErrors,
      });
      return;
    }

    const result = updateUserStatusSchema.safeParse(req.body);

    if (!result.success) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    const { id } = req.params;

    const user = await UserModel.findOne({
      id: id as string,
    });

    if (!user) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message: "User not found",
      });
      return;
    }

    const input: updateUserStatusRequestBody = result.data;

    const updatedUser = await UserModel.update(user.id, {
      status: input.status,
    });

    if (!updatedUser) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Something went wrong. Unable to update user status.",
      });
      return;
    }

    const parsedUser = {
      id: user?.id,
      role_id: user?.role_id,
      first_name: user?.first_name,
      last_name: user?.last_name,
      email_id: user?.email_id,
      phone_number: user?.phone_number,
      gender: user?.gender,
      created_at: user?.created_at,
      updated_at: user?.updated_at,
      status: user?.status,
    };

    res
      .status(HttpStatus.CREATED)
      .json({ message: "User status updated successfully", user: parsedUser });
  },

  async softDelete(req: Request, res: Response): Promise<void> {
    const reqID = getUserByIdParamsSchema.safeParse(req.params);

    if (!reqID.success) {
      res.status(400).json({
        message: "Invalid User Id",
        errors: reqID.error.flatten().fieldErrors,
      });
      return;
    }

    const { id } = req.params;

    const user = await UserModel.findOne({
      id: id as string,
    });

    if (!user) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message: "User not found",
      });
      return;
    }

    const inactiveUser = await UserModel.update(user.id, {
      status: USER_STATUS.INACTIVE,
    });

    if (!inactiveUser) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Something went wrong. Unable to delete user.",
      });
      return;
    }

    const parsedUser = {
      id: inactiveUser?.id,
      role_id: inactiveUser?.role_id,
      first_name: inactiveUser?.first_name,
      last_name: inactiveUser?.last_name,
      email_id: inactiveUser?.email_id,
      phone_number: inactiveUser?.phone_number,
      gender: inactiveUser?.gender,
      created_at: inactiveUser?.created_at,
      updated_at: inactiveUser?.updated_at,
      status: inactiveUser?.status,
    };

    res
      .status(HttpStatus.CREATED)
      .json({ message: "User deleted successfully", user: parsedUser });
  },

  async delete(req: Request, res: Response): Promise<void> {
    const reqID = getUserByIdParamsSchema.safeParse(req.params);

    if (!reqID.success) {
      res.status(400).json({
        message: "Invalid User Id",
        errors: reqID.error.flatten().fieldErrors,
      });
      return;
    }

    const { id } = req.params;

    const user = await UserModel.findOne({
      id: id as string,
    });

    if (!user) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message: "User not found",
      });
      return;
    }

    const deletedUser = await UserModel.delete(user.id);

    if (!deletedUser) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: "Something went wrong. Unable to delete user.",
      });
      return;
    }

    res
      .status(HttpStatus.CREATED)
      .json({ message: "User deleted successfully", user: deletedUser });
  },
};
