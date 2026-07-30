import { query } from "@/config/db.js";

export enum ROLES_ENUM {
  CUSTOMER = "customer",
  VENDOR = "vendor",
  MANAGER = "manager",
  STAFF = "staff",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

export interface Roles {
  id: number;
  name: ROLES_ENUM;
  description?: string;
}

export const RolesModel = {
  async list(): Promise<Roles[]> {
    const result = await query<Roles>("SELECT * FROM roles ORDER BY id ASC");
    return result.rows;
  },

  async seed(): Promise<void> {
    const roleDescriptions: Record<ROLES_ENUM, string> = {
      [ROLES_ENUM.CUSTOMER]: "A customer who purchases products or services",
      [ROLES_ENUM.VENDOR]:
        "A vendor who sells products or services on the platform",
      [ROLES_ENUM.MANAGER]: "A manager overseeing staff and operations",
      [ROLES_ENUM.STAFF]: "A staff member handling day-to-day operations",
      [ROLES_ENUM.ADMIN]: "An administrator with elevated platform access",
      [ROLES_ENUM.SUPER_ADMIN]:
        "A super administrator with full platform access",
    };

    const values = Object.values(ROLES_ENUM);

    await query(
      `INSERT INTO roles (name, description)
       SELECT * FROM UNNEST($1::text[], $2::text[])
       ON CONFLICT (name) DO NOTHING`,
      [values, values.map((v) => roleDescriptions[v])],
    );
  },
};
