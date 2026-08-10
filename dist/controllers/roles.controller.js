import { RolesModel } from "@/models/roles.model.js";
export const rolesController = {
    async list(req, res) {
        try {
            const roles = await RolesModel.list();
            if (!roles) {
                res
                    .status(500)
                    .json({ message: "Something went wrong during fetching roles" });
            }
            if (!!roles && roles?.length) {
                res.status(200).json({ status: "ok", roles });
            }
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Something went wrong" });
        }
    },
};
//# sourceMappingURL=roles.controller.js.map