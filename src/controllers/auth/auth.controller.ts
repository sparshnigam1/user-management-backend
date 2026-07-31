import {
  loginSchema,
  SignupRequestBody,
  signupSchema,
} from "@/controllers/auth/schema.js";
import { hashPassword, verifyPassword } from "@/helpers/authHelper.js";
import { ROLES_ENUM, RolesModel } from "@/models/roles.model.js";
import { UserModel } from "@/models/users.model.js";
import { Request, Response } from "express";

export const authController = {
  async signup(req: Request, res: Response): Promise<void> {
    const result = signupSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    const input: SignupRequestBody = result.data;

    try {
      const roles = await RolesModel.list();
      const customerRole = roles.find(
        ({ name }) => name === ROLES_ENUM.CUSTOMER,
      );
      if (!customerRole) {
        res.status(500).json({ message: "Customer role is not configured" });
        return;
      }

      const hashedPassword = await hashPassword(input.password);
      const userFormattedReqBody = {
        ...input,
        password: hashedPassword,
        role_id: customerRole.id,
      };
      const user = await UserModel.create(userFormattedReqBody);

      res.status(201).json({ message: "Signup successful", user });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "Something went wrong during signup" });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    try {
      const user = await UserModel.findOne({
        email_id: req.body.email_id,
      });

      if (!user) {
        res.status(400).json({
          message: "Invalid eamil id",
        });
      }

      const isPassword = await verifyPassword(
        req.body.password,
        user?.password as string,
      );

      if (!isPassword) {
        res.status(400).json({
          message: "Invalid eamil or password",
        });
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
        is_locked: user?.is_locked,
      };

      res.status(201).json({ message: "Login successful", user: parsedUser });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "Something went wrong during login" });
    }
  },
};
