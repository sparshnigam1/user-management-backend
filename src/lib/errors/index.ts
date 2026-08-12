import { HttpStatus } from "@/lib/http/status.js";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean; // expected vs. programming error
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    details?: unknown,
    isOperational = true,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

interface PgError extends Error {
  code?: string;
  constraint?: string;
  table?: string;
  column?: string;
  detail?: string;
}

// Customize per-constraint messaging here, in one place.
const CONSTRAINT_MESSAGES: Record<string, string> = {
  users_email_id_key: "An account with this email already exists",
  users_phone_number_key: "An account with this phone number already exists",
};

function isPgError(error: unknown): error is PgError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as PgError).code === "string"
  );
}

export function mapPgError(error: unknown): AppError | null {
  if (!isPgError(error)) return null;

  switch (error.code) {
    case "23505": // unique_violation
      return new AppError(
        (error.constraint && CONSTRAINT_MESSAGES[error.constraint]) ||
          "A record with these details already exists",
        HttpStatus.CONFLICT,
        { constraint: error.constraint },
      );

    case "23503": // foreign_key_violation
      return new AppError(
        "Referenced record does not exist",
        HttpStatus.BAD_REQUEST,
        { constraint: error.constraint },
      );

    case "23502": // not_null_violation
      return new AppError(
        `${error.column ?? "A required field"} cannot be empty`,
        HttpStatus.BAD_REQUEST,
      );

    case "23514": // check_violation
      return new AppError(
        "One or more fields failed validation",
        HttpStatus.BAD_REQUEST,
        { constraint: error.constraint },
      );

    case "22P02": // invalid_text_representation, e.g. bad UUID/int
      return new AppError("Invalid value provided", HttpStatus.BAD_REQUEST);

    case "57014": // query_canceled (statement timeout)
      return new AppError(
        "The request took too long, please try again",
        HttpStatus.GATEWAY_TIMEOUT ?? 504,
      );

    case "08006": // connection_failure
    case "08001": // sqlclient_unable_to_establish_sqlconnection
      return new AppError(
        "Database is temporarily unavailable",
        HttpStatus.SERVICE_UNAVAILABLE ?? 503,
      );

    default:
      return null; // not something we specifically handle
  }
}
