// routes/users/schema.ts (or wherever your other schemas live)
import {
  MODULE_STATUS_ENUM,
  MODULE_TYPE_ENUM,
} from "@/models/modules.model.js";
import { z } from "zod";

export const createModuleSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  route: z.string().optional(),
  query_str_type: z.string().optional(),
  query_str_value: z.string().optional(),
  type: z.enum(MODULE_TYPE_ENUM),
  parent_id: z.string().optional(),
  icon: z.string().optional(),
  priority: z.number().optional(),
});
export type createUserRequestBody = z.infer<typeof createModuleSchema>;

export const createBulkModuleSchema = z.object({
  parent_id: z.string().uuid(),
  module: z
    .array(
      z.object({
        name: z.string().min(1),
        route: z.string().optional(),
        query_str_type: z.string().optional(),
        query_str_value: z.string().optional(),
        type: z.enum(MODULE_TYPE_ENUM),
        icon: z.string().optional(),
        priority: z.number().int().optional(),
      }),
    )
    .min(1),
});

export type CreateBulkModuleRequestBody = z.infer<
  typeof createBulkModuleSchema
>;

export const getModuleByIdParamsSchema = z.object({
  id: z.string().uuid({ message: "Invalid module id" }),
});
export type GetModuleByIdParams = z.infer<typeof getModuleByIdParamsSchema>;

export const updateModuleSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  route: z.string().optional(),
  query_str_type: z.string().optional(),
  query_str_value: z.string().optional(),
  type: z.enum(MODULE_TYPE_ENUM).optional(),
  parent_id: z.string().optional(),
  icon: z.string().optional(),
  priority: z.string().optional(),
});
export type updateModuleRequestBody = z.infer<typeof updateModuleSchema>;

export const updateModuleStatusSchema = z.object({
  status: z.enum(MODULE_STATUS_ENUM),
});
export type updateModuleStatusRequestBody = z.infer<
  typeof updateModuleStatusSchema
>;
