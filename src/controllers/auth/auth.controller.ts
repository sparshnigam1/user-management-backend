import { jwtConfig, requireEnv } from "@/config/index.js";
import {
  forgetPasswordSchema,
  loginLinkRequestSchema,
  loginLinkVerifySchema,
  loginSchema,
  resendOTPSchema,
  resetPasswordRequestBody,
  resetPasswordSchema,
  SignupRequestBody,
  signupSchema,
  verifyForgetPassOTPSchema,
} from "@/controllers/auth/schema.js";
import {
  createLoginLinkToken,
  createToken,
  generateOtp,
  hashPassword,
  verifyLoginLinkToken,
  verifyPassword,
} from "@/helpers/authHelper.js";
import {
  loginLinkEmail,
  otpLoginEmail,
  passwordResetSuccessEmail,
  sendPasswordResetOtpEmail,
} from "@/lib/email/index.js";
import { HttpStatus } from "@/lib/http/status.js";
import { ROLES_ENUM, RolesModel } from "@/models/roles.model.js";
import { UserModel } from "@/models/users.model.js";
import { expiresInToMs, getSessionCookieOptions } from "@/utils/cookies.js";
import { NextFunction, Request, Response } from "express";

export const authController = {
  async signup(req: Request, res: Response): Promise<void> {
    const result = signupSchema.safeParse(req.body);

    if (!result.success) {
      res.status(HttpStatus.BAD_REQUEST).json({
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
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: "Customer role is not configured" });
        return;
      }

      const hashedPassword = await hashPassword(input.password);
      const userFormattedReqBody = {
        ...input,
        password: hashedPassword,
        role_id: customerRole.id,
      };
      const user = await UserModel.create(userFormattedReqBody);

      res
        .status(HttpStatus.CREATED)
        .json({ message: "Signup successful", user });
    } catch (error: any) {
      console.error(error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Something went wrong during signup" });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    try {
      const user = await UserModel.findOne({
        email_id: req.body.email_id,
      });

      if (!user) {
        res.status(HttpStatus.BAD_REQUEST).json({
          message: "Invalid eamil id",
        });
      }

      const isPassword = await verifyPassword(
        req.body.password,
        user?.password as string,
      );

      if (!isPassword) {
        res.status(HttpStatus.BAD_REQUEST).json({
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

      const cookieName = requireEnv("COOKIE_KEY");
      const token = createToken({ user: user?.email_id, role: user?.role_id });
      const tokenMaxAge = expiresInToMs(jwtConfig.jwtExpiresIn);

      res.cookie(cookieName, token, getSessionCookieOptions(tokenMaxAge));
      res
        .status(HttpStatus.OK)
        .json({ message: "Login successful", user: parsedUser, token });
    } catch (error: any) {
      console.error(error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Something went wrong during login" });
    }
  },

  async logout(req: Request, res: Response): Promise<void> {
    const sessionCookieName = requireEnv("COOKIE_KEY");
    res.clearCookie(sessionCookieName, { path: "/" });
    res.status(200).json({ message: "Logout successful" });
  },

  async forgetPassword(req: Request, res: Response): Promise<void> {
    const result = forgetPasswordSchema.safeParse(req.body);

    if (!result.success) {
      res.status(HttpStatus.BAD_REQUEST).json({
        status: false,
        message: "Validation failed",
        error: result.error.flatten().fieldErrors,
      });
      return;
    }

    try {
      const user = await UserModel.findOne({
        email_id: req.body.email_id,
      });

      if (!user) {
        res.status(HttpStatus.BAD_REQUEST).json({
          status: false,
          message: "Invalid email id",
        });
        return;
      }

      const otp = generateOtp(6);
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

      const updatedUser = await UserModel.update(user.id, {
        otp: otp,
        otp_expiry: otpExpiry,
      });

      if (!updatedUser) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          status: false,
          message: "Something went wrong. OTP generation failed.",
        });
        return;
      }

      await sendPasswordResetOtpEmail(updatedUser.email_id, otp);

      res.status(HttpStatus.OK).json({
        status: true,
        message: "OTP sent to your registered email id",
        user: updatedUser.email_id,
      });
    } catch (error: any) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Something went wrong, please try again after sometime",
      });
    }
  },

  async verifyForgetPassOTP(req: Request, res: Response): Promise<void> {
    const result = verifyForgetPassOTPSchema.safeParse(req.body);

    if (!result.success) {
      res.status(HttpStatus.BAD_REQUEST).json({
        status: false,
        message: "Validation failed",
        error: result.error.flatten().fieldErrors,
      });
      return;
    }

    try {
      const user = await UserModel.findOne({
        email_id: req.body.user,
      });

      if (!user) {
        res.status(HttpStatus.BAD_REQUEST).json({
          status: false,
          message: "Invalid user",
        });
        return;
      }

      if (user.otp == req.body.otp) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          status: false,
          message: "Invalid OTP",
        });
        return;
      }

      if (!user.otp_expiry || new Date(user.otp_expiry) < new Date()) {
        res.status(HttpStatus.BAD_REQUEST).json({
          status: false,
          message: "OTP has expired",
        });
        return;
      }

      res.status(HttpStatus.OK).json({
        status: true,
        message: "success",
      });
    } catch (error: any) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Something went wrong, please try again after sometime",
      });
    }
  },

  async resetPassword(req: Request, res: Response): Promise<void> {
    const result = resetPasswordSchema.safeParse(req.body);

    if (!result.success) {
      res.status(HttpStatus.BAD_REQUEST).json({
        status: false,
        message: "Validation failed",
        error: result.error.flatten().fieldErrors,
      });
      return;
    }

    const input: resetPasswordRequestBody = result.data;

    try {
      const user = await UserModel.findOne({
        email_id: req.body.user,
      });

      if (!user) {
        res.status(HttpStatus.BAD_REQUEST).json({
          status: false,
          message: "Invalid user",
        });
        return;
      }
      const hashedPassword = await hashPassword(input.password);
      const updateBody = {
        password: hashedPassword,
        otp: null,
        otp_expiry: null,
      };

      const updatedUser = await UserModel.update(user.id, { ...updateBody });

      if (!updatedUser) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          status: false,
          message: "Something went wrong. Password reset failed.",
        });
        return;
      }

      await passwordResetSuccessEmail(updatedUser.email_id);

      res
        .status(HttpStatus.CREATED)
        .json({ status: true, message: "Password reset successful" });
    } catch (error: any) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Something went wrong, please try again after sometime",
      });
    }
  },

  async otpLogin(req: Request, res: Response): Promise<void> {
    const result = forgetPasswordSchema.safeParse(req.body);

    if (!result.success) {
      res.status(HttpStatus.BAD_REQUEST).json({
        status: false,
        message: "Validation failed",
        error: result.error.flatten().fieldErrors,
      });
      return;
    }

    try {
      const user = await UserModel.findOne({
        email_id: req.body.email_id,
      });

      if (!user) {
        res.status(HttpStatus.BAD_REQUEST).json({
          status: false,
          message: "Invalid email id",
        });
        return;
      }

      const otp = generateOtp(6);
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

      const updatedUser = await UserModel.update(user.id, {
        otp: otp,
        otp_expiry: otpExpiry,
      });

      if (!updatedUser) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          status: false,
          message: "Something went wrong. OTP generation failed.",
        });
        return;
      }

      await otpLoginEmail(updatedUser.email_id, otp);

      res.status(HttpStatus.OK).json({
        status: true,
        message: "OTP sent to your registered email id",
        user: updatedUser.email_id,
      });
    } catch (error: any) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Something went wrong, please try again after sometime",
      });
    }
  },

  async verifyLoginOTP(req: Request, res: Response): Promise<void> {
    const result = verifyForgetPassOTPSchema.safeParse(req.body);

    if (!result.success) {
      res.status(HttpStatus.BAD_REQUEST).json({
        status: false,
        message: "Validation failed",
        error: result.error.flatten().fieldErrors,
      });
      return;
    }

    try {
      const user = await UserModel.findOne({
        email_id: req.body.user,
      });

      if (!user) {
        res.status(HttpStatus.BAD_REQUEST).json({
          status: false,
          message: "Invalid user",
        });
        return;
      }

      if (!user.otp_expiry || new Date(user.otp_expiry) < new Date()) {
        res.status(HttpStatus.BAD_REQUEST).json({
          status: false,
          message: "OTP has been expired",
        });
        return;
      }

      if (user.otp !== req.body.otp) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          status: false,
          message: "Invalid OTP",
        });
        return;
      }

      const updateBody = {
        otp: null,
        otp_expiry: null,
      };

      const updatedUser = await UserModel.update(user.id, { ...updateBody });

      if (!updatedUser) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          status: false,
          message: "Something went wrong. Password reset failed.",
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
        is_locked: user?.is_locked,
      };

      const cookieName = requireEnv("COOKIE_KEY");
      const token = createToken({ user: user?.email_id, role: user?.role_id });
      const tokenMaxAge = expiresInToMs(jwtConfig.jwtExpiresIn);

      res.cookie(cookieName, token, getSessionCookieOptions(tokenMaxAge));
      res
        .status(HttpStatus.OK)
        .json({ message: "Login successful", user: parsedUser, token });
    } catch (error: any) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Something went wrong, please try again after sometime",
      });
    }
  },

  resendOTP(type: "reset" | "login") {
    return async (
      req: Request,
      res: Response,
      _next: NextFunction,
    ): Promise<void> => {
      const result = resendOTPSchema.safeParse(req.body);
      if (!result.success) {
        res.status(HttpStatus.BAD_REQUEST).json({
          status: false,
          message: "Validation failed",
          error: result.error.flatten().fieldErrors,
        });
        return;
      }

      try {
        const user = await UserModel.findOne({ email_id: req.body.user });
        if (!user) {
          res
            .status(HttpStatus.BAD_REQUEST)
            .json({ status: false, message: "Invalid email id" });
          return;
        }

        const otp = generateOtp(6);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        const updatedUser = await UserModel.update(user.id, {
          otp,
          otp_expiry: otpExpiry,
        });

        if (!updatedUser) {
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            status: false,
            message: "Something went wrong. OTP generation failed.",
          });
          return;
        }

        await (type === "reset"
          ? sendPasswordResetOtpEmail(updatedUser.email_id, otp)
          : otpLoginEmail(updatedUser.email_id, otp));

        res.status(HttpStatus.OK).json({
          status: true,
          message: "OTP sent to your registered email id",
          user: updatedUser.email_id,
        });
      } catch (error: any) {
        console.error(error);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: "Something went wrong, please try again after sometime",
        });
      }
    };
  },

  async requestLoginLink(req: Request, res: Response): Promise<void> {
    const result = loginLinkRequestSchema.safeParse(req.body);
    if (!result.success) {
      res.status(HttpStatus.BAD_REQUEST).json({
        status: false,
        message: "Validation failed",
        error: result.error.flatten().fieldErrors,
      });
      return;
    }

    try {
      const user = await UserModel.findOne({
        email_id: req.body.email_id,
      });

      if (!user) {
        res.status(HttpStatus.BAD_REQUEST).json({
          status: false,
          message: "Invalid email id",
        });
        return;
      }

      if (user) {
        const token = createLoginLinkToken(user.email_id);
        const frontendUrl = requireEnv("FRONTEND_BASE_URL");
        const link = `${frontendUrl}/auth/login-link/verify?token=${encodeURIComponent(token)}`;
        await loginLinkEmail(user.email_id, link);
      }
      res.status(HttpStatus.OK).json({
        status: true,
        message: "A login link has been sent",
      });
    } catch (error: any) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Something went wrong, please try again after sometime",
      });
    }
  },

  async verifyLoginLink(req: Request, res: Response): Promise<void> {
    const result = loginLinkVerifySchema.safeParse(req.query);
    if (!result.success) {
      res.status(HttpStatus.BAD_REQUEST).json({
        status: false,
        message: "Invalid or missing token",
      });
      return;
    }

    const payload = verifyLoginLinkToken(result.data.token);
    if (!payload) {
      res.status(HttpStatus.BAD_REQUEST).json({
        status: false,
        message: "Link is invalid or has expired",
      });
      return;
    }

    try {
      const user = await UserModel.findOne({ email_id: payload.email_id });
      if (!user) {
        res
          .status(HttpStatus.BAD_REQUEST)
          .json({ status: false, message: "Invalid user" });
        return;
      }

      const cookieName = requireEnv("COOKIE_KEY");
      const token = createToken({ user: user.email_id, role: user.role_id });
      const tokenMaxAge = expiresInToMs(jwtConfig.jwtExpiresIn);

      res.cookie(cookieName, token, getSessionCookieOptions(tokenMaxAge));
      res.status(HttpStatus.OK).json({
        status: true,
        message: "Login successful",
        user: {
          id: user.id,
          role_id: user.role_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email_id: user.email_id,
        },
      });
    } catch (error: any) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Something went wrong, please try again after sometime",
      });
    }
  },
};
