import { AppError, mapPgError } from "@/lib/errors/index.js";
import { HttpStatus } from "@/lib/http/status.js";
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res
    .status(404)
    .json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // 1. Explicit AppError thrown somewhere in the app
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
    return;
  }

  // 2. Zod validation errors that slipped through as throws
  if (error instanceof ZodError) {
    res.status(HttpStatus.BAD_REQUEST).json({
      message: "Validation failed",
      errors: error.flatten().fieldErrors,
    });
    return;
  }

  // 3. Postgres driver errors
  const pgError = mapPgError(error);
  if (pgError) {
    res.status(pgError.statusCode).json({ message: pgError.message });
    return;
  }

  // 4. Unknown/unexpected — log full detail, return generic message
  console.error("Unhandled error:", error);
  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    message: "Something went wrong, please try again later",
  });
}
