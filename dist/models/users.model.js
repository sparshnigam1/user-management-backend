import { query } from "@/config/db.js";
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
];
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
];
export const UserModel = {
  async findAll() {
    const result = await query(`SELECT * FROM users`);
    return result.rows;
  },
  async findOne(param) {
    const entries = Object.entries(param).filter(([key]) =>
      ALLOWED_FIND_COLUMNS.includes(key),
    );
    if (entries.length === 0) {
      throw new Error("find() requires at least one valid field to match on");
    }
    const whereClause = entries
      .map(([key], index) => `${key} = $${index + 1}`)
      .join(" AND ");
    const values = entries.map(([, value]) => value);
    const result = await query(
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
  }) {
    const result = await query(
      `INSERT INTO users (role_id, first_name, last_name, email_id, phone_number, password, gender)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, role_id, first_name, last_name, email_id, phone_number, gender, created_at, updated_at, status`,
      [
        role_id,
        first_name,
        last_name ?? null,
        email_id,
        phone_number ?? null,
        password,
        gender ?? null,
      ],
    );
    return result.rows[0];
  },
  async update(id, param) {
    const entries = Object.entries(param).filter(
      ([key, value]) =>
        ALLOWED_UPDATE_COLUMNS.includes(key) && value !== undefined,
    );
    if (entries.length === 0) {
      throw new Error("update() requires at least one valid field to match on");
    }
    const setClause = entries
      .map(([key], index) => `${key} = $${index + 1}`)
      .join(", ");
    const values = entries.map(([, value]) => value);
    const result = await query(
      `UPDATE users
     SET ${setClause}, updated_at = NOW()
     WHERE id = $${entries.length + 1}
     RETURNING id, role_id, first_name, last_name, email_id, phone_number, gender, created_at, updated_at, status, otp, otp_expiry`,
      [...values, id],
    );
    return result.rows[0];
  },
};
//# sourceMappingURL=users.model.js.map
