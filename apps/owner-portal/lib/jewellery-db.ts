import "server-only";

export type DbError = {
  message: string;
  code?: string;
};

export type DbResult<T> = {
  data: T | null;
  error: DbError | null;
};

export type OrderOptions = {
  ascending?: boolean;
  nullsFirst?: boolean;
  referencedTable?: string;
};

export type UpsertOptions = {
  onConflict?: string;
  ignoreDuplicates?: boolean;
};

export interface DbQuery<Row extends object>
  extends PromiseLike<DbResult<Row[]>> {
  select(columns?: string): DbQuery<Row>;
  eq(column: string, value: unknown): DbQuery<Row>;
  neq(column: string, value: unknown): DbQuery<Row>;
  gte(column: string, value: unknown): DbQuery<Row>;
  lte(column: string, value: unknown): DbQuery<Row>;
  in(column: string, values: readonly unknown[]): DbQuery<Row>;
  order(column: string, options?: OrderOptions): DbQuery<Row>;
  limit(count: number): DbQuery<Row>;
  insert(values: Record<string, unknown> | readonly Record<string, unknown>[]): DbQuery<Row>;
  update(values: Record<string, unknown>): DbQuery<Row>;
  upsert(
    values: Record<string, unknown> | readonly Record<string, unknown>[],
    options?: UpsertOptions
  ): DbQuery<Row>;
}

export type JewelleryDb = {
  from<Row extends object>(table: string): DbQuery<Row>;
};

export function asJewelleryDb(client: unknown): JewelleryDb {
  return client as JewelleryDb;
}

export function assertDbResult<T>(result: DbResult<T>, operation: string): T {
  if (result.error) {
    throw new Error(`${operation}: ${result.error.message}`);
  }
  if (result.data === null) {
    throw new Error(`${operation}: database returned no result.`);
  }
  return result.data;
}

export function assertDbWrite(result: DbResult<unknown>, operation: string): void {
  if (result.error) {
    throw new Error(`${operation}: ${result.error.message}`);
  }
}
