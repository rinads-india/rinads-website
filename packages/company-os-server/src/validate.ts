import type { Row } from "./db";

/** Tiny input validators for domain tools (model/UI input is never trusted). */
export type Input = Record<string, unknown>;
export class InputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputError";
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function str(input: Input, key: string, o: { min?: number; max?: number; optional?: boolean } = {}): string | undefined {
  const v = input[key];
  if (v === undefined || v === null || v === "") {
    if (o.optional) return undefined;
    throw new InputError(`${key} is required`);
  }
  if (typeof v !== "string") throw new InputError(`${key} must be text`);
  const s = v.trim();
  if (o.min !== undefined && s.length < o.min) throw new InputError(`${key} is too short`);
  if (s.length > (o.max ?? 2000)) throw new InputError(`${key} is too long`);
  return s;
}

export const reqStr = (input: Input, key: string, o: { min?: number; max?: number } = {}): string => str(input, key, { min: 1, ...o }) as string;

export function uuid(input: Input, key: string, optional = false): string | undefined {
  const v = input[key];
  if (v === undefined || v === null || v === "") {
    if (optional) return undefined;
    throw new InputError(`${key} is required`);
  }
  if (typeof v !== "string" || !UUID.test(v)) throw new InputError(`${key} must be an id`);
  return v.toLowerCase();
}

export const reqUuid = (input: Input, key: string): string => uuid(input, key) as string;

export function num(input: Input, key: string, o: { min?: number; max?: number; optional?: boolean; int?: boolean } = {}): number | undefined {
  const v = input[key];
  if (v === undefined || v === null || v === "") {
    if (o.optional) return undefined;
    throw new InputError(`${key} is required`);
  }
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) throw new InputError(`${key} must be a number`);
  if (o.int && !Number.isInteger(n)) throw new InputError(`${key} must be a whole number`);
  if (o.min !== undefined && n < o.min) throw new InputError(`${key} must be at least ${o.min}`);
  if (o.max !== undefined && n > o.max) throw new InputError(`${key} must be at most ${o.max}`);
  return n;
}

export function oneOf<T extends string>(input: Input, key: string, allowed: readonly T[], optional = false): T | undefined {
  const v = input[key];
  if (v === undefined || v === null || v === "") {
    if (optional) return undefined;
    throw new InputError(`${key} is required`);
  }
  if (typeof v !== "string" || !(allowed as readonly string[]).includes(v)) throw new InputError(`${key} must be one of: ${allowed.join(", ")}`);
  return v as T;
}

export function date(input: Input, key: string, optional = true): string | undefined {
  const v = str(input, key, { optional, max: 40 });
  if (v === undefined) return undefined;
  if (Number.isNaN(Date.parse(v))) throw new InputError(`${key} must be a date`);
  return v;
}

export function bool(input: Input, key: string, fallback: boolean): boolean {
  const v = input[key];
  return typeof v === "boolean" ? v : fallback;
}

export function strArray(input: Input, key: string, o: { max?: number } = {}): string[] {
  const v = input[key];
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) throw new InputError(`${key} must be a list of text`);
  if (v.length > (o.max ?? 50)) throw new InputError(`${key} has too many items`);
  return v.map((x) => (x as string).trim()).filter(Boolean);
}

export function uuidArray(input: Input, key: string): string[] {
  return strArray(input, key).map((x) => {
    if (!UUID.test(x)) throw new InputError(`${key} must contain ids`);
    return x.toLowerCase();
  });
}

export function pick<T extends Row>(row: T | undefined, ...keys: string[]): Row {
  const out: Row = {};
  for (const k of keys) if (row && k in row) out[k] = row[k];
  return out;
}

export function compact<T extends Row>(row: T): T {
  return Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined)) as T;
}
