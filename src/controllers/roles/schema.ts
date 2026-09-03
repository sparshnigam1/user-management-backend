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

export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .optional(),
  description: z.string().optional(),
});
export type updateRoleRequestBody = z.infer<typeof updateRoleSchema>;

export const updateRoleStatusSchema = z.object({
  status: z.number(),
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
