// config.ts
import dotenv from "dotenv";
dotenv.config();

export const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const jwtConfig = {
  jwtSecret: requireEnv("JWT_SECRET"),
  jwtRefreshSecret: requireEnv("JWT_REFRESH_SECRET"),
  jwtIssuer: requireEnv("JWT_ISSUER"),
  jwtAudience: requireEnv("JWT_AUDIENCE"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "72h",
};
