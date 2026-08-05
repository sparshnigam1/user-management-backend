// utils/cookies.ts
import { CookieOptions } from "express";

export const SESSION_COOKIE_NAME = "session";

export function getSessionCookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true, // JS can't read it — mitigates XSS token theft
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    sameSite: "strict", // adjust to "lax" if frontend is a different subdomain, "none" if cross-site (requires secure: true)
    maxAge: maxAgeMs,
    path: "/",
  };
}

// Converts your JWT_EXPIRES_IN (e.g. "24h") into milliseconds for the cookie's maxAge.
// Cookie expiry should roughly match token expiry.
export function expiresInToMs(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 24 * 60 * 60 * 1000; // fallback: 24h

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const unitMs: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * unitMs[unit];
}
