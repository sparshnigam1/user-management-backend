import dotenv from "dotenv";
import { Pool } from "pg";
dotenv.config();
const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.PGSSL === "true"
            ? { rejectUnauthorized: false }
            : undefined,
    }
    : {
        host: process.env.PGHOST || "localhost",
        port: Number(process.env.PGPORT) || 5432,
        user: process.env.PGUSER || "postgres",
        password: process.env.PGPASSWORD || "postgres",
        database: process.env.PGDATABASE || "ecommerce",
        ssl: process.env.PGSSL === "true"
            ? { rejectUnauthorized: false }
            : undefined,
    };
export const pool = new Pool({
    ...poolConfig,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});
pool.on("error", (err) => {
    // eslint-disable-next-line no-console
    console.error("Unexpected error on idle PostgreSQL client", err);
    process.exit(-1);
});
/**
 * Thin wrapper around pool.query so call sites don't import pg directly.
 * Logs slow queries in development to help spot missing indexes early.
 */
export async function query(text, params) {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === "development" && duration > 200) {
        // eslint-disable-next-line no-console
        console.warn(`Slow query (${duration}ms): ${text}`);
    }
    return result;
}
export async function checkDbConnection() {
    const client = await pool.connect();
    try {
        await client.query("SELECT 1");
    }
    finally {
        client.release();
    }
}
//# sourceMappingURL=db.js.map