import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, isAppError } from "./errors";

// Common error -> HTTP response mapping for Route Handlers.
export function handleError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: error.flatten() },
      { status: 400 },
    );
  }

  if (isAppError(error)) {
    return NextResponse.json(
      { error: error.code, message: error.message, details: error.details },
      { status: error.status },
    );
  }

  console.error("Beklenmeyen hata:", error);
  return NextResponse.json(
    { error: "INTERNAL", message: "Sunucu hatası" },
    { status: 500 },
  );
}

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}
