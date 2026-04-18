import { NextResponse } from "next/server";

import { AIConfigurationError, AIProviderError, AIValidationError } from "@/lib/ai/errors";
import { AuthRequiredError, DatabaseUnavailableError } from "@/lib/auth";
import type { AIActionResult } from "@/types/ai";

export function createSuccessResponse(data: Exclude<AIActionResult, { ok: false }>["data"]) {
  return NextResponse.json<AIActionResult>({
    ok: true,
    data,
  });
}

export function createErrorResponse(error: unknown) {
  if (error instanceof AIValidationError) {
    return NextResponse.json<AIActionResult>(
      {
        ok: false,
        error: error.message,
        details: error.details,
      },
      { status: 400 },
    );
  }

  if (error instanceof AIConfigurationError) {
    return NextResponse.json<AIActionResult>(
      {
        ok: false,
        error: error.message,
      },
      { status: 500 },
    );
  }

  if (error instanceof AIProviderError) {
    return NextResponse.json<AIActionResult>(
      {
        ok: false,
        error: error.message,
      },
      { status: 502 },
    );
  }

  if (error instanceof AuthRequiredError) {
    return NextResponse.json<AIActionResult>(
      {
        ok: false,
        error: error.message,
      },
      { status: 401 },
    );
  }

  if (error instanceof DatabaseUnavailableError) {
    return NextResponse.json<AIActionResult>(
      {
        ok: false,
        error: error.message,
      },
      { status: 503 },
    );
  }

  return NextResponse.json<AIActionResult>(
    {
      ok: false,
      error: error instanceof Error ? error.message : "Unexpected AI generation error.",
    },
    { status: 500 },
  );
}
