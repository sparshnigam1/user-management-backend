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

export enum ROLE_STATUS_ENUM {
  INACTIVE = 0,
  ACTIVE = 1,
}

export interface Roles {
  id: string;
  name: ROLES_ENUM;
  description?: string;
  parent_id?: string;
  status?: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_system_role: boolean;
}

const ALLOWED_FIND_COLUMNS = [
  "id",
  "name",
  "description",
  "parent_id",
  "status",
  "created_at",
  "updated_at",
  "created_by",
  "is_system_role",
] as const;

type FindableColumn = (typeof ALLOWED_FIND_COLUMNS)[number];

type FindParams = Partial<Record<FindableColumn, string | boolean>>;

type ConditionalFindParams = Partial<
  Record<FindableColumn, string | boolean>
> & {
  not?: Partial<
    Record<FindableColumn, string | boolean | (string | boolean)[]>
  >;
};

interface CreateRoleParams {
  name: string;
  description?: string;
  userId: string;
  parentId: string;
}

interface AssignRoleParams {
  roleId: string;
  userId: string;
  assignedBy: string;
}

interface UpdateRoleParams {
  roleId: string;
  updatedBy: string;
  updates: Partial<{
    name: string;
    description: string;
    status: number;
    parentId: string | null;
  }>;
}

export const RolesModel = {
  async findAll(): Promise<Roles[]> {
    const result = await query<Roles>("SELECT * FROM roles ORDER BY id ASC");
    return result.rows;
  },

  async findOne(param: FindParams): Promise<Roles | undefined> {
    const entries = Object.entries(param).filter(([key]) =>
      ALLOWED_FIND_COLUMNS.includes(key as FindableColumn),
    );

    if (entries.length === 0) {
      throw new Error("find() requires at least one valid field to match on");
    }

    const whereClause = entries
      .map(([key], index) => `${key} = $${index + 1}`)
      .join(" AND ");

    const values = entries.map(([, value]) => value);

    const result = await query<Roles>(
      `SELECT * FROM roles WHERE ${whereClause} LIMIT 1`,
      values,
    );

    return result.rows[0];
  },

  async conditionalFindAll({
    not,
    ...eq
  }: ConditionalFindParams): Promise<Roles[] | undefined> {
    const eqEntries = Object.entries(eq).filter(([key]) =>
      ALLOWED_FIND_COLUMNS.includes(key as FindableColumn),
    );
    const notEntries = Object.entries(not ?? {}).filter(([key]) =>
      ALLOWED_FIND_COLUMNS.includes(key as FindableColumn),
    );

    if (eqEntries.length === 0 && notEntries.length === 0) {
      throw new Error(
        "conditionalFindAll() requires at least one valid field to match on",
      );
    }

    const clauses: string[] = [];
    const values: (string | boolean)[] = [];

    eqEntries.forEach(([key, value]) => {
      values.push(value);
      clauses.push(`${key} = $${values.length}`);
    });

    notEntries.forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // NOT IN (...) for multiple excluded values on the same column
        const placeholders = value.map((v) => {
          values.push(v);
          return `$${values.length}`;
        });
        clauses.push(`${key} NOT IN (${placeholders.join(", ")})`);
      } else {
        values.push(value);
        clauses.push(`${key} != $${values.length}`);
      }
    });

    const whereClause = clauses.join(" AND ");

    const result = await query<Roles>(
      `SELECT * FROM roles WHERE ${whereClause}`,
      values,
    );

    return result.rows;
  },

  async findVisibleRoles(userId: string): Promise<Roles[]> {
    const result = await query<Roles>(
      `
      SELECT DISTINCT r.*
      FROM roles r
      LEFT JOIN role_access ra
        ON ra.role_id = r.id
      WHERE
          r.is_system_role = TRUE

          OR r.created_by = $1

          OR ra.user_id = $1

          OR EXISTS (
              SELECT 1
              FROM users u
              INNER JOIN roles ur
                ON ur.id = u.role_id
              WHERE
                  u.id = $1
                  AND ur.name = $2
          )

      ORDER BY r.created_at DESC
      `,
      [userId, ROLES_ENUM.SUPER_ADMIN],
    );

    return result.rows;
  },

  async create({
    name,
    description,
    userId,
    parentId,
  }: CreateRoleParams): Promise<Roles> {
    const result = await query<Roles>(
      `
    INSERT INTO roles (
      name,
      description,
      parent_id,
      created_by,
      is_system_role,
      status
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      FALSE,
      1
    )
    RETURNING *;
    `,
      [name, description ?? null, parentId, userId],
    );

    const role = result.rows[0];

    await query(
      `
    INSERT INTO role_access (
      role_id,
      user_id,
      granted_by
    )
    VALUES ($1, $2, $2)
    ON CONFLICT (role_id, user_id)
    DO NOTHING;
    `,
      [role.id, userId],
    );

    return role;
  },

  async assignRoleToUser({
    roleId,
    userId,
    assignedBy,
  }: AssignRoleParams): Promise<void> {
    // 1. Check that the role exists
    const roleResult = await query<Roles>(
      `
      SELECT
        id,
        name,
        created_by,
        is_system_role,
        status
      FROM roles
      WHERE id = $1
      LIMIT 1
      `,
      [roleId],
    );

    const role = roleResult.rows[0];

    if (!role) {
      throw new Error("Role not found");
    }

    if (role.status !== 1) {
      throw new Error("Cannot assign an inactive role");
    }

    // 2. Check that the target user exists
    const userResult = await query<{ id: string }>(
      `
      SELECT id
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [userId],
    );

    if (!userResult.rows[0]) {
      throw new Error("User not found");
    }

    // 3. Check whether assigner is Super Admin
    const superAdminResult = await query<{ exists: boolean }>(
      `
      SELECT EXISTS (
        SELECT 1
        FROM users u
        INNER JOIN roles r
          ON r.id = u.role_id
        WHERE
          u.id = $1
          AND r.name = $2
      ) AS exists
      `,
      [assignedBy, ROLES_ENUM.SUPER_ADMIN],
    );

    const isSuperAdmin = superAdminResult.rows[0]?.exists;

    // 4. Only Super Admin OR role creator can assign the role
    if (!isSuperAdmin && role.created_by !== assignedBy) {
      throw new Error("You are not authorized to assign this role");
    }

    // 5. Grant access to the role
    await query(
      `
      INSERT INTO role_access (
        role_id,
        user_id,
        granted_by
      )
      VALUES ($1, $2, $3)
      ON CONFLICT (role_id, user_id)
      DO NOTHING
      `,
      [roleId, userId, assignedBy],
    );
  },

  async update({
    roleId,
    updatedBy,
    updates,
  }: UpdateRoleParams): Promise<Roles> {
    // 1. Find the role
    const roleResult = await query<Roles>(
      `
    SELECT
      id,
      name,
      description,
      parent_id,
      created_by,
      is_system_role,
      status
    FROM roles
    WHERE id = $1
    LIMIT 1
    `,
      [roleId],
    );

    const role = roleResult.rows[0];

    if (!role) {
      throw new Error("Role not found");
    }

    // 2. System roles cannot be modified
    if (role.is_system_role) {
      throw new Error("System roles cannot be modified");
    }

    // 3. Check whether updatedBy is Super Admin
    const superAdminResult = await query<{ exists: boolean }>(
      `
    SELECT EXISTS (
      SELECT 1
      FROM users u
      INNER JOIN roles r
        ON r.id = u.role_id
      WHERE
        u.id = $1
        AND r.name = $2
    ) AS exists
    `,
      [updatedBy, ROLES_ENUM.SUPER_ADMIN],
    );

    const isSuperAdmin = superAdminResult.rows[0]?.exists ?? false;

    // 4. Only creator or Super Admin can update
    if (!isSuperAdmin && role.created_by !== updatedBy) {
      throw new Error("You are not authorized to update this role");
    }

    // 5. Allowed fields
    const allowedFields = {
      name: "name",
      description: "description",
      status: "status",
      parentId: "parent_id",
    } as const;

    // 6. Convert API field names to database columns
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    for (const [key, value] of Object.entries(updates)) {
      const column = allowedFields[key as keyof typeof allowedFields];

      if (!column) {
        continue;
      }

      values.push(value as string | number | null);
      fields.push(`${column} = $${values.length}`);
    }

    // 7. Make sure something is being updated
    if (fields.length === 0) {
      throw new Error(
        "At least one valid field is required to update the role",
      );
    }

    // 8. Always update updated_at
    fields.push("updated_at = NOW()");

    // 9. roleId placeholder comes after update values
    values.push(roleId);

    const result = await query<Roles>(
      `
    UPDATE roles
    SET ${fields.join(", ")}
    WHERE id = $${values.length}
    RETURNING *;
    `,
      values,
    );

    return result.rows[0];
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
