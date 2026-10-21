import type { Row } from "@rinads/company-os-server";

/** Tiny accessors for raw detail rows (snake_case from the database). Nothing is guessed: missing → null / "—". */
export const s = (r: Row, k: string): string => (r[k] === null || r[k] === undefined ? "" : String(r[k]));
export const sn = (r: Row, k: string): string | null => (r[k] === null || r[k] === undefined || r[k] === "" ? null : String(r[k]));
export const n = (r: Row, k: string): number | null => (r[k] === null || r[k] === undefined ? null : Number(r[k]));
export const arr = (r: Row, k: string): string[] => (Array.isArray(r[k]) ? (r[k] as unknown[]).map(String) : []);
