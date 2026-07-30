import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app.js";
import { checkDbConnection, pool } from "./config/db.js";

const PORT = Number(process.env.PORT) || 3001;

async function start(): Promise<void> {
  try {
    await checkDbConnection();
    console.log("Connected to PostgreSQL.");
  } catch (err) {
    console.error("Failed to connect to PostgreSQL:", err);
    process.exit(1);
  }

  const app = createApp();

  const server = app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await pool.end();
      console.log("HTTP server and DB pool closed.");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start();
