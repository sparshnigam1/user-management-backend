import { ROLE_STATUS_ENUM } from "@/models/roles.model.js";
import { z } from "zod";

export const createRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  description: z.string().optional(),
});
export type createRoleRequestBody = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters")
      .optional(),

    description: z
      .string()
      .trim()
      .min(1, "Description should not be empty")
      .optional(),
  })
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: "At least one field is required",
  });
export type updateRoleRequestBody = z.infer<typeof updateRoleSchema>;

export const updateRoleStatusSchema = z.object({
  status: z.enum(ROLE_STATUS_ENUM),
});
export type updateRoleStatusRequestBody = z.infer<
  typeof updateRoleStatusSchema
>;

export const assignRoleSchema = z.object({
  assign_to: z.string().uuid({ message: "Invalid assign id" }),
});
export type assignRoleRequestBody = z.infer<typeof assignRoleSchema>;

export const getRoleByIdParamsSchema = z.object({
  id: z.string().uuid({ message: "Invalid role id" }),
});
export type GetRoleByIdParams = z.infer<typeof getRoleByIdParamsSchema>;
