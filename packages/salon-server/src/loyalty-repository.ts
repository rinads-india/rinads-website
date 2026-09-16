import {
  fail,
  ok,
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
    input: Partial<Pick<SalonLoyaltyProgram, "name" | "isActive" | "currency" | "earnCurrencyUnits" | "earnPoints" | "pointsPerCurrencyUnit" | "tiers">>
  ): Promise<Result<SalonLoyaltyProgram>> {
    const existingResult = await this.getProgram(organizationId);
    const existing = existingResult.ok ? existingResult.data : undefined;
    const row: SalonRow = {
      organization_id: organizationId,
      name: input.name ?? existing?.name ?? "R GLOW Rewards",
      is_active: input.isActive ?? existing?.isActive ?? true,
      currency: input.currency ?? existing?.currency ?? "INR",
      earn_currency_units: input.earnCurrencyUnits ?? existing?.earnCurrencyUnits ?? 100,
      earn_points: input.earnPoints ?? existing?.earnPoints ?? 1,
      points_per_currency_unit: input.pointsPerCurrencyUnit ?? existing?.pointsPerCurrencyUnit ?? 10,
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

  private async mutateLedger(fn: string, args: Record<string, unknown>): Promise<Result<SalonLoyaltyLedgerEntry>> {
    const { data, error } = await this.client.rpc(fn, args);
    if (error) return fail("db_error", error.message);
    if (!data) return fail("db_error", "No loyalty ledger entry returned.");
    return ok(mapLoyaltyLedgerRow(data as SalonRow));
  }
}
