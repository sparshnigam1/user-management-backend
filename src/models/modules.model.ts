import { pool, query } from "@/config/db.js";
import { PoolClient } from "pg";

export enum MODULE_TYPE_ENUM {
  MODULE = 1,
  SUB_MODULE = 2,
  OTHER = 3,
}

export enum MODULE_STATUS_ENUM {
  ACTIVE = 1,
  INACTIVE = 0,
}

export interface Modules {
  id: string;
  name: string;
  route?: string;
  query_str_type?: string;
  query_str_value?: string;
  type: MODULE_TYPE_ENUM;
  parent_id?: string;
  icon?: string;
  priority?: number;
  status?: MODULE_STATUS_ENUM;
  created_at: string;
  updated_at: string;
}

export interface CreateModuleInput {
  name: string;
  route?: string;
  query_str_type?: string;
  query_str_value?: string;
  type: MODULE_TYPE_ENUM;
  parent_id?: string;
  icon?: string;
  priority?: number;
  status?: MODULE_STATUS_ENUM;
}

const ALLOWED_FIND_COLUMNS = [
  "id",
  "name",
  "route",
  "query_str_type",
  "query_str_value",
  "type",
  "parent_id",
  "icon",
  "priority",
  "status",
  "created_at",
  "updated_at",
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

const ALLOWED_UPDATE_COLUMNS = [
  "name",
  "route",
  "query_str_type",
  "query_str_value",
  "type",
  "parent_id",
  "icon",
  "priority",
  "status",
  "updated_at",
] as const;

type UpdateableColumn = (typeof ALLOWED_UPDATE_COLUMNS)[number];

type UpdateParams = Partial<
  Record<
    Exclude<UpdateableColumn, "updated_at">,
    string | boolean | Date | null | MODULE_STATUS_ENUM | MODULE_TYPE_ENUM
  >
>;

export const ModulesModel = {
  async findAll(): Promise<Modules[]> {
    const result = await query<Modules>(
      "SELECT * FROM modules ORDER BY id ASC",
    );
    return result.rows;
  },

  async findOne(param: FindParams): Promise<Modules | undefined> {
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

    const result = await query<Modules>(
      `SELECT * FROM modules WHERE ${whereClause} LIMIT 1`,
      values,
    );

    return result.rows[0];
  },

  async conditionalFindAll({
    not,
    ...eq
  }: ConditionalFindParams): Promise<Modules[] | undefined> {
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

    const result = await query<Modules>(
      `SELECT * FROM modules WHERE ${whereClause}`,
      values,
    );

    return result.rows;
  },

  async create(input: CreateModuleInput): Promise<Modules> {
    const {
      name,
      route = null,
      query_str_type = null,
      query_str_value = null,
      type,
      parent_id = null,
      icon = null,
      priority = null,
      status = MODULE_STATUS_ENUM.ACTIVE,
    } = input;

    const result = await query<Modules>(
      `INSERT INTO modules
        (name, route, query_str_type, query_str_value, type, parent_id, icon, priority, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        name,
        route,
        query_str_type,
        query_str_value,
        type,
        parent_id,
        icon,
        priority,
        status,
      ],
    );

    return result.rows[0];
  },

  async bulkCreate(
    parentId: string,
    modules: CreateModuleInput[],
  ): Promise<Modules[]> {
    const client: PoolClient = await pool.connect();

    try {
      await client.query("BEGIN");

      const createdModules: Modules[] = [];

      for (const module of modules) {
        const {
          name,
          route = null,
          query_str_type = null,
          query_str_value = null,
          type,
          icon = null,
          priority = null,
          status = MODULE_STATUS_ENUM.ACTIVE,
        } = module;

        const result = await client.query<Modules>(
          `INSERT INTO modules
            (
              name,
              route,
              query_str_type,
              query_str_value,
              type,
              parent_id,
              icon,
              priority,
              status
            )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [
            name,
            route,
            query_str_type,
            query_str_value,
            type,
            parentId,
            icon,
            priority,
            status,
          ],
        );

        createdModules.push(result.rows[0]);
      }

      await client.query("COMMIT");

      return createdModules;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  async update(id: string, param: UpdateParams): Promise<Modules | undefined> {
    const entries = Object.entries(param).filter(
      ([key, value]) =>
        ALLOWED_UPDATE_COLUMNS.includes(key as UpdateableColumn) &&
        value !== undefined,
    );

    if (entries.length === 0) {
      throw new Error("update() requires at least one valid field to match on");
    }

    const setClause = entries
      .map(([key], index) => `${key} = $${index + 1}`)
      .join(", ");

    const values = entries.map(([, value]) => value);

    const result = await query<Modules>(
      `UPDATE modules
       SET ${setClause}, updated_at = NOW()
       WHERE id = $${entries.length + 1}
       RETURNING *`,
      [...values, id],
    );

    return result.rows[0];
  },

  async delete(id: string): Promise<Modules | undefined> {
    const result = await query<Modules>(
      `DELETE FROM modules
       WHERE id = $1
       RETURNING *`,
      [id],
    );

    return result.rows[0];
  },
};
