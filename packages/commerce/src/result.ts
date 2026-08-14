import type { ApiError, Result } from "./types";

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err(
  code: string,
  message: string,
  fieldErrors?: Record<string, string>,
  requestId?: string
): Result<never> {
  return {
    ok: false,
    error: { code, message, fieldErrors, requestId } satisfies ApiError,
  };
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
