import {
  fail,
  ok,
  planLoyaltyExpiryBatch,
  resolveLoyaltyTier,
  type LoyaltyAccountSummary,
  type Result,
  type SalonLoyaltyAccount,
  type SalonLoyaltyLedgerEntry,
  type SalonLoyaltyProgram,
  type SalonLoyaltyRedemption,
} from "@rinads/salon";
import type { SalonRow, SalonSupabaseClient } from "./client";
import {
  mapLoyaltyAccountRow,
  mapLoyaltyLedgerRow,
  mapLoyaltyProgramRow,
  mapLoyaltyRedemptionRow,
} from "./mappers";

export type LoyaltyExpiryBatchResult = {
  organizationId: string;
  batchId: string | null;
  accountsExpired: number;
  pointsExpired: number;
  skipped: boolean;
  reason?: string;
};

export class SalonLoyaltyRepository {
  constructor(private readonly client: SalonSupabaseClient) {}

  async getProgram(organizationId: string): Promise<Result<SalonLoyaltyProgram>> {
    const { data, error } = await this.client.from("salon_loyalty_programs").select("*").eq("organization_id", organizationId).maybeSingle();
    if (error) return fail("db_error", error.message);
    if (!data) return fail("not_found", "Loyalty program not found.");
    return ok(mapLoyaltyProgramRow(data));
  }

  async upsertProgram(
    organizationId: string,
    input: Partial<Pick<SalonLoyaltyProgram, "name" | "isActive" | "currency" | "earnCurrencyUnits" | "earnPoints" | "pointsPerCurrencyUnit" | "pointsExpiryDays" | "tiers">>
  ): Promise<Result<SalonLoyaltyProgram>> {
    const existingResult = await this.getProgram(organizationId);
    const existing = existingResult.ok ? existingResult.data : undefined;
    const expiryDays =
      input.pointsExpiryDays === undefined
        ? existing?.pointsExpiryDays ?? null
        : input.pointsExpiryDays === null || input.pointsExpiryDays === 0
          ? null
          : input.pointsExpiryDays;
    if (expiryDays != null && (!Number.isInteger(expiryDays) || expiryDays <= 0)) {
      return fail("validation_error", "pointsExpiryDays must be a positive whole number or empty to disable.");
    }
    const row: SalonRow = {
      organization_id: organizationId,
      name: input.name ?? existing?.name ?? "R GLOW Rewards",
      is_active: input.isActive ?? existing?.isActive ?? true,
      currency: input.currency ?? existing?.currency ?? "INR",
      earn_currency_units: input.earnCurrencyUnits ?? existing?.earnCurrencyUnits ?? 100,
      earn_points: input.earnPoints ?? existing?.earnPoints ?? 1,
      points_per_currency_unit: input.pointsPerCurrencyUnit ?? existing?.pointsPerCurrencyUnit ?? 10,
      points_expiry_days: expiryDays,
      tiers: input.tiers ?? existing?.tiers ?? [{ name: "Member", minimumPoints: 0 }],
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await this.client.from("salon_loyalty_programs").upsert(row, { onConflict: "organization_id" }).select("*").single();
    if (error) return fail("db_error", error.message);
    if (!data) return fail("db_error", "No loyalty program returned.");
    return ok(mapLoyaltyProgramRow(data));
  }

  async getAccount(organizationId: string, customerId: string): Promise<Result<SalonLoyaltyAccount>> {
    const { data, error } = await this.client.from("salon_loyalty_accounts").select("*")
      .eq("organization_id", organizationId).eq("customer_id", customerId).maybeSingle();
    if (error) return fail("db_error", error.message);
    if (!data) return fail("not_found", "Loyalty account not found.");
    return ok(mapLoyaltyAccountRow(data));
  }

  async getBalance(organizationId: string, customerId: string): Promise<Result<number>> {
    const { data, error } = await this.client.rpc("salon_loyalty_balance", {
      p_organization_id: organizationId, p_customer_id: customerId,
    });
    if (error) return fail("db_error", error.message);
    return ok(Number(data ?? 0));
  }

  async listLedger(organizationId: string, accountId: string, limit = 100): Promise<Result<SalonLoyaltyLedgerEntry[]>> {
    const { data, error } = await this.client.from("salon_loyalty_ledger_entries").select("*")
      .eq("organization_id", organizationId).eq("account_id", accountId)
      .order("created_at", { ascending: false }).limit(limit);
    if (error) return fail("db_error", error.message);
    return ok((data ?? []).map(mapLoyaltyLedgerRow));
  }

  async listAccounts(organizationId: string): Promise<Result<LoyaltyAccountSummary[]>> {
    const [program, accountsResult] = await Promise.all([
      this.getProgram(organizationId),
      this.client.from("salon_loyalty_accounts").select("*").eq("organization_id", organizationId).order("updated_at", { ascending: false }),
    ]);
    if (!program.ok) return program;
    if (accountsResult.error) return fail("db_error", accountsResult.error.message);
    const summaries: LoyaltyAccountSummary[] = [];
    for (const row of accountsResult.data ?? []) {
      const account = mapLoyaltyAccountRow(row);
      const ledger = await this.listLedger(organizationId, account.id);
      if (!ledger.ok) return ledger;
      const balance = ledger.data.reduce((sum, entry) => sum + entry.points, 0);
      summaries.push({ account, balance, tier: resolveLoyaltyTier(account.lifetimeEarnedPoints, program.data.tiers) });
    }
    return ok(summaries);
  }

  async earn(organizationId: string, customerId: string, points: number, reason: string, idempotencyKey: string): Promise<Result<SalonLoyaltyLedgerEntry>> {
    return this.mutateLedger("salon_loyalty_earn", { p_organization_id: organizationId, p_customer_id: customerId, p_points: points, p_reason: reason, p_idempotency_key: idempotencyKey });
  }

  async adjust(organizationId: string, customerId: string, points: number, reason: string, idempotencyKey: string): Promise<Result<SalonLoyaltyLedgerEntry>> {
    return this.mutateLedger("salon_loyalty_adjust", { p_organization_id: organizationId, p_customer_id: customerId, p_points: points, p_reason: reason, p_idempotency_key: idempotencyKey });
  }

  async redeem(organizationId: string, customerId: string, points: number, saleId: string | undefined, idempotencyKey: string): Promise<Result<SalonLoyaltyRedemption>> {
    const { data, error } = await this.client.rpc("salon_loyalty_redeem", {
      p_organization_id: organizationId, p_customer_id: customerId, p_points: points,
      p_sale_id: saleId ?? null, p_idempotency_key: idempotencyKey,
    });
    if (error) return fail("db_error", error.message);
    if (!data) return fail("db_error", "No redemption returned.");
    return ok(mapLoyaltyRedemptionRow(data as SalonRow));
  }

  async reverse(organizationId: string, redemptionId: string, reason: string, idempotencyKey: string): Promise<Result<SalonLoyaltyLedgerEntry>> {
    return this.mutateLedger("salon_loyalty_reverse_redemption", {
      p_organization_id: organizationId, p_redemption_id: redemptionId, p_reason: reason, p_idempotency_key: idempotencyKey,
    });
  }

  /**
   * Runs one idempotent expiry batch for a tenant. No-ops when expiry is disabled
   * or there is nothing to expire. Service-role only for posting expire rows.
   */
  async runExpiryBatch(
    organizationId: string,
    options: { asOf?: Date; idempotencyKey: string; ledgerLimit?: number }
  ): Promise<Result<LoyaltyExpiryBatchResult>> {
    const asOf = options.asOf ?? new Date();
    const idempotencyKey = options.idempotencyKey;
    if (!idempotencyKey) return fail("validation_error", "idempotencyKey is required.");

    const existing = await this.client
      .from("salon_loyalty_expiry_batches")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (existing.error) return fail("db_error", existing.error.message);
    if (existing.data) {
      return ok({
        organizationId,
        batchId: String(existing.data.id),
        accountsExpired: Number(existing.data.accounts_expired ?? 0),
        pointsExpired: Number(existing.data.points_expired ?? 0),
        skipped: true,
        reason: "idempotent_replay",
      });
    }

    const program = await this.getProgram(organizationId);
    if (!program.ok) return program;
    const expiryDays = program.data.pointsExpiryDays;
    if (expiryDays == null || expiryDays <= 0) {
      return ok({ organizationId, batchId: null, accountsExpired: 0, pointsExpired: 0, skipped: true, reason: "expiry_disabled" });
    }

    const accountsResult = await this.client
      .from("salon_loyalty_accounts")
      .select("*")
      .eq("organization_id", organizationId);
    if (accountsResult.error) return fail("db_error", accountsResult.error.message);

    const plannedInputs: Array<{ accountId: string; customerId: string; entries: SalonLoyaltyLedgerEntry[] }> = [];
    for (const row of accountsResult.data ?? []) {
      const account = mapLoyaltyAccountRow(row);
      const ledger = await this.listLedger(organizationId, account.id, options.ledgerLimit ?? 500);
      if (!ledger.ok) return ledger;
      plannedInputs.push({ accountId: account.id, customerId: account.customerId, entries: ledger.data });
    }

    const planned = planLoyaltyExpiryBatch(plannedInputs, expiryDays, asOf);
    if (!planned.length) {
      const emptyInsert = await this.client
        .from("salon_loyalty_expiry_batches")
        .insert({
          organization_id: organizationId,
          as_of: asOf.toISOString(),
          accounts_expired: 0,
          points_expired: 0,
          idempotency_key: idempotencyKey,
        })
        .select("*")
        .single();
      if (emptyInsert.error) return fail("db_error", emptyInsert.error.message);
      return ok({
        organizationId,
        batchId: String(emptyInsert.data?.id ?? ""),
        accountsExpired: 0,
        pointsExpired: 0,
        skipped: false,
      });
    }

    const batchInsert = await this.client
      .from("salon_loyalty_expiry_batches")
      .insert({
        organization_id: organizationId,
        as_of: asOf.toISOString(),
        accounts_expired: 0,
        points_expired: 0,
        idempotency_key: idempotencyKey,
      })
      .select("*")
      .single();
    if (batchInsert.error) return fail("db_error", batchInsert.error.message);
    const batchId = String(batchInsert.data?.id ?? "");

    let accountsExpired = 0;
    let pointsExpired = 0;
    for (const item of planned) {
      const { data, error } = await this.client.rpc("salon_loyalty_post_expire", {
        p_organization_id: organizationId,
        p_account_id: item.accountId,
        p_points: item.points,
        p_batch_id: batchId,
        p_idempotency_key: `${idempotencyKey}:${item.accountId}`,
      });
      if (error) return fail("db_error", error.message);
      if (data) {
        accountsExpired += 1;
        pointsExpired += item.points;
      }
    }

    const update = await this.client
      .from("salon_loyalty_expiry_batches")
      .update({ accounts_expired: accountsExpired, points_expired: pointsExpired })
      .eq("organization_id", organizationId)
      .eq("id", batchId);
    if (update.error) return fail("db_error", update.error.message);

    return ok({ organizationId, batchId, accountsExpired, pointsExpired, skipped: false });
  }

  private async mutateLedger(fn: string, args: Record<string, unknown>): Promise<Result<SalonLoyaltyLedgerEntry>> {
    const { data, error } = await this.client.rpc(fn, args);
    if (error) return fail("db_error", error.message);
    if (!data) return fail("db_error", "No loyalty ledger entry returned.");
    return ok(mapLoyaltyLedgerRow(data as SalonRow));
  }
}
