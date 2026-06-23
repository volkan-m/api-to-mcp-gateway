// Application-wide typed error management.
// Service layer throws these errors; Route Handlers map them to HTTP codes.

export type AppErrorCode =
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INVALID_CIPHER"
  | "SSRF_BLOCKED"
  | "SPEC_PARSE_ERROR"
  | "CONFLICT"
  | "INTERNAL";

const STATUS_MAP: Record<AppErrorCode, number> = {
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  INVALID_CIPHER: 400,
  SSRF_BLOCKED: 400,
  SPEC_PARSE_ERROR: 422,
  CONFLICT: 409,
  INTERNAL: 500,
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: AppErrorCode, message?: string, details?: unknown) {
    super(message ?? code);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS_MAP[code];
    this.details = details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
