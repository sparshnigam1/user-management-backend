// routes/users/schema.ts (or wherever your other schemas live)
import { E164_REGEX } from "@/constants/index.js";
import { z } from "zod";

export const createUserSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100),
  last_name: z.string().optional(),
  role_id: z.string().optional(),
  email_id: z.string().trim().toLowerCase().email("Invalid email address"),
  phone_number: z
    .string()
    .trim()
    .regex(E164_REGEX, "Please provide a valid phone number")
    .optional(),
  gender: z.string().optional(),
  password: z
    .string()
    .optional()
    .refine(
      (data) =>
        !data ||
        (data.length >= 6 &&
          /[A-Z]/.test(data) &&
          /[a-z]/.test(data) &&
          /[0-9]/.test(data)),
      {
        message:
          "Password must be at least 6 characters and include uppercase, lowercase, and a number",
      },
    ),
});
export type createUserRequestBody = z.infer<typeof createUserSchema>;

export const getUserByIdParamsSchema = z.object({
  id: z.string().uuid({ message: "Invalid user id" }),
});
export type GetUserByIdParams = z.infer<typeof getUserByIdParamsSchema>;
