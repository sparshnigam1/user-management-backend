// routes/users/schema.ts (or wherever your other schemas live)
import { z } from "zod";

export const getUserByIdParamsSchema = z.object({
  id: z.string().uuid({ message: "Invalid user id" }),
});

export type GetUserByIdParams = z.infer<typeof getUserByIdParamsSchema>;
