import { E164_REGEX } from "@/constants/index.js";
import z from "zod";

export const signupSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100),
  last_name: z.string().optional(),
  email_id: z.string().trim().toLowerCase().email("Invalid email address"),
  phone_number: z
    .string()
    .trim()
    .regex(E164_REGEX, "Please provide a valid phone number")
    .optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  // .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  // .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  // .regex(/[0-9]/, "Password must contain at least one number"),
});
export type SignupRequestBody = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email_id: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  // .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  // .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  // .regex(/[0-9]/, "Password must contain at least one number"),
});
export type LoginRequestBody = z.infer<typeof loginSchema>;

export const forgetPasswordSchema = z.object({
  email_id: z.string().trim().toLowerCase().email("Invalid email address"),
});
export type forgetPasswordRequestBody = z.infer<typeof forgetPasswordSchema>;

export const verifyForgetPassOTPSchema = z.object({
  otp: z.string().trim().min(6, "OTP must be 6 digits"),
  user: z.string().trim().toLowerCase().email("Invalid user"),
});
export type verifyForgetPassOTPRequestBody = z.infer<
  typeof verifyForgetPassOTPSchema
>;

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  user: z.string().trim().toLowerCase().email("Invalid user"),
});
export type resetPasswordRequestBody = z.infer<typeof resetPasswordSchema>;

// Response Schema
// export const SignupUserResponseBodySchema = z.object({
//   message: z.string(),
// });

// export type SignupUserResponseBody = z.infer<
//   typeof SignupUserResponseBodySchema
// >;

// export type SignupUserSchema = {
//   request: { body: SignupRequestBody };
//   response: SignupUserResponseBody;
// };

// export type SignupUserRequest = ApiRequest<SignupUserSchema>;
// export type SignupUserResponse = ApiResponse<SignupUserSchema>;
