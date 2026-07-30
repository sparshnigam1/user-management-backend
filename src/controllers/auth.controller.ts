import { ROLES_ENUM, RolesModel } from "@/models/roles.model.js";
import { UserModel } from "@/models/users.model.js";
import { SignupRequestBody, signupSchema } from "@/routes/auth/schema.js";
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

      const userFormattedReqBody = { ...input, role_id: customerRole.id };
      const user = await UserModel.create(userFormattedReqBody);

      res.status(201).json({ message: "Signup successful", user });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "Something went wrong during signup" });
    }
  },

  async login(req: Request, res: Response): Promise<void> {},
};
