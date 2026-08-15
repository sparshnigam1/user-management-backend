import { query } from "@/config/db.js";
import { USER_STATUS } from "@/lib/types/user.js";

export interface User {
  id: number;
  role_id: string;
  first_name: string;
  last_name?: string;
  email_id: string;
  phone_number?: string;
  password: string;
  gender?: string;
  created_at: string;
  updated_at: string;
  status: USER_STATUS;
  otp?: string | null;
  otp_expiry?: string | null;
}

export interface CreateUserInput {
  role_id: string;
  first_name: string;
  last_name?: string;
  email_id: string;
  phone_number?: string;
  password?: string;
  gender?: string;
}

export interface UpdateUserInput {
  role_id?: string;
  first_name: string;
  last_name?: string;
  email_id: string;
  phone_number?: string;
  password: string;
  gender?: string;
  status?: boolean;
}

const ALLOWED_FIND_COLUMNS = [
  "id",
  "role_id",
  "first_name",
  "last_name",
  "email_id",
  "phone_number",
  "password",
  "gender",
  "created_at",
  "updated_at",
  "status",
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
  "role_id",
  "first_name",
  "last_name",
  "email_id",
  "phone_number",
  "password",
  "gender",
  "updated_at",
  "status",
  "otp",
  "otp_expiry",
] as const;

type UpdateableColumn = (typeof ALLOWED_UPDATE_COLUMNS)[number];

type UpdateParams = Partial<
  Record<
    Exclude<UpdateableColumn, "updated_at">,
    string | boolean | Date | null
  >
>;

export const UserModel = {
  async findAll(): Promise<User[] | undefined> {
    const result = await query<User>(`SELECT * FROM users`);

    return result.rows;
  },

  async conditionalFindAll({
    not,
    ...eq
  }: ConditionalFindParams): Promise<User[] | undefined> {
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

    const result = await query<User>(
      `SELECT * FROM users WHERE ${whereClause}`,
      values,
    );

    return result.rows;
  },

  async findOne(param: FindParams): Promise<User | undefined> {
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

    const result = await query<User>(
      `SELECT * FROM users WHERE ${whereClause} LIMIT 1`,
      values,
    );

    return result.rows[0];
  },

  async create({
    role_id,
    first_name,
    last_name,
    email_id,
    phone_number,
    password,
    gender,
  }: CreateUserInput): Promise<User> {
    const result = await query<User>(
      `INSERT INTO users (role_id, first_name, last_name, email_id, phone_number, password, gender)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, role_id, first_name, last_name, email_id, phone_number, gender, created_at, updated_at, status`,
      [
        role_id,
        first_name,
        last_name ?? null,
        email_id,
        phone_number ?? null,
        password ?? null,
        gender ?? null,
      ],
    );
    return result.rows[0];
  },

  async update(id: number, param: UpdateParams): Promise<User | undefined> {
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

    const result = await query<User>(
      `UPDATE users
     SET ${setClause}, updated_at = NOW()
     WHERE id = $${entries.length + 1}
     RETURNING id, role_id, first_name, last_name, email_id, phone_number, gender, created_at, updated_at, status, otp, otp_expiry`,
      [...values, id],
    );

    return result.rows[0];
  },

  async delete(id: number): Promise<User | undefined> {
    const result = await query<User>(
      `DELETE FROM users
     WHERE id = $1
     RETURNING id, role_id, first_name, last_name, email_id, phone_number, gender, created_at, updated_at, status`,
      [id],
    );

    return result.rows[0];
  },
};
