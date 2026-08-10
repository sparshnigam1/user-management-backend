import { query } from "@/config/db.js";
export var ROLES_ENUM;
(function (ROLES_ENUM) {
    ROLES_ENUM["CUSTOMER"] = "customer";
    ROLES_ENUM["VENDOR"] = "vendor";
    ROLES_ENUM["MANAGER"] = "manager";
    ROLES_ENUM["STAFF"] = "staff";
    ROLES_ENUM["ADMIN"] = "admin";
    ROLES_ENUM["SUPER_ADMIN"] = "super_admin";
})(ROLES_ENUM || (ROLES_ENUM = {}));
export const RolesModel = {
    async list() {
        const result = await query("SELECT * FROM roles ORDER BY id ASC");
        return result.rows;
    },
    async seed() {
        const roleDescriptions = {
            [ROLES_ENUM.CUSTOMER]: "A customer who purchases products or services",
            [ROLES_ENUM.VENDOR]: "A vendor who sells products or services on the platform",
            [ROLES_ENUM.MANAGER]: "A manager overseeing staff and operations",
            [ROLES_ENUM.STAFF]: "A staff member handling day-to-day operations",
            [ROLES_ENUM.ADMIN]: "An administrator with elevated platform access",
            [ROLES_ENUM.SUPER_ADMIN]: "A super administrator with full platform access",
        };
        const values = Object.values(ROLES_ENUM);
        await query(`INSERT INTO roles (name, description)
       SELECT * FROM UNNEST($1::text[], $2::text[])
       ON CONFLICT (name) DO NOTHING`, [values, values.map((v) => roleDescriptions[v])]);
    },
};
//# sourceMappingURL=roles.model.js.map