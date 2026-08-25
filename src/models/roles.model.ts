import { query } from "@/config/db.js";
import { uuidv7 } from "uuidv7";

export enum ROLES_ENUM {
  CUSTOMER = "customer",
  VENDOR = "vendor",
  MANAGER = "manager",
  STAFF = "staff",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

export interface Roles {
  id: string;
  name: ROLES_ENUM;
  description?: string;
  parent_id?: string;
  status?: number;
  created_at: string;
  updated_at: string;
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

    // parent hierarchy: super_admin -> admin -> manager -> staff
    // customer & vendor have no parent
    const roleParents: Record<ROLES_ENUM, ROLES_ENUM | null> = {
      [ROLES_ENUM.SUPER_ADMIN]: null,
      [ROLES_ENUM.ADMIN]: ROLES_ENUM.SUPER_ADMIN,
      [ROLES_ENUM.MANAGER]: ROLES_ENUM.ADMIN,
      [ROLES_ENUM.STAFF]: ROLES_ENUM.MANAGER,
      [ROLES_ENUM.VENDOR]: null,
      [ROLES_ENUM.CUSTOMER]: null,
    };

    const names = Object.values(ROLES_ENUM);
    const ids = names.map(() => uuidv7());
    const descriptions = names.map((n) => roleDescriptions[n]);

    // Pass 1: insert all roles with generated ids (parent_id left null for now)
    await query(
      `INSERT INTO roles (id, name, description)
       SELECT * FROM UNNEST($1::uuid[], $2::text[], $3::text[])
       ON CONFLICT (name) DO NOTHING`,
      [ids, names, descriptions],
    );

    // Pass 2: wire up parent_id now that every role row exists
    for (const name of names) {
      const parentName = roleParents[name];
      if (!parentName) continue;

      await query(
        `UPDATE roles
         SET parent_id = (SELECT id FROM roles WHERE name = $1)
         WHERE name = $2`,
        [parentName, name],
      );
    }
  },
};
