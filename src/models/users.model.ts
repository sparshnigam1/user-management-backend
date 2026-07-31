import { query } from "@/config/db.js";

export interface User {
  id: number;
  role_id: number;
  first_name: string;
  last_name?: string;
  email_id: string;
  phone_number?: string;
  password: string;
  gender?: string;
  created_at: string;
  updated_at: string;
  is_locked: boolean;
}

export interface CreateUserInput {
  role_id: number;
  first_name: string;
  last_name?: string;
  email_id: string;
  phone_number?: string;
  password: string;
  gender?: string;
}

export interface UpdateUserInput {
  role_id?: number;
  first_name: string;
  last_name?: string;
  email_id: string;
  phone_number?: string;
  password: string;
  gender?: string;
  is_locked?: boolean;
}

export const UserModel = {
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
       RETURNING id, role_id, first_name, last_name, email_id, phone_number, gender, created_at, updated_at, is_locked`,
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
};
