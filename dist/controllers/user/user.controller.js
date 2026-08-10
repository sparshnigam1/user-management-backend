import { UserModel } from "@/models/users.model.js";
import { getUserByIdParamsSchema } from "./schema.js";
export const userController = {
    async listAll(req, res) {
        try {
            const users = await UserModel.findAll();
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
                is_locked: user?.is_locked,
            }));
            res
                .status(200)
                .json({ message: "request successfull", users: parsedUser });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Something went wrong during login" });
        }
    },
    async getUserById(req, res) {
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
            const user = await UserModel.findOne({ id: id });
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
                is_locked: user?.is_locked,
            };
            res
                .status(200)
                .json({ message: "request successfull", users: parsedUser });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    },
};
//# sourceMappingURL=user.controller.js.map