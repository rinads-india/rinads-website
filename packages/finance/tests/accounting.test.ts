import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildTrialBalance,
  normalBalanceForAccountType,
  validateJournalLines,
} from "../src/index";

describe("Finance Core", () => {
  it("maps account types to their normal balance", () => {
    assert.equal(normalBalanceForAccountType("asset"), "debit");
    assert.equal(normalBalanceForAccountType("expense"), "debit");
    assert.equal(normalBalanceForAccountType("liability"), "credit");
    assert.equal(normalBalanceForAccountType("equity"), "credit");
    assert.equal(normalBalanceForAccountType("income"), "credit");
  });

  it("accepts a balanced journal in minor units", () => {
    const result = validateJournalLines([
      { accountId: "cash", debitMinor: 118_000, creditMinor: 0 },
      { accountId: "revenue", debitMinor: 0, creditMinor: 100_000 },
      { accountId: "tax_payable", debitMinor: 0, creditMinor: 18_000 },
    ]);

    assert.deepEqual(result, {
      ok: true,
      totalDebitMinor: 118_000,
      totalCreditMinor: 118_000,
    });
  });

  it("rejects an unbalanced journal", () => {
    const result = validateJournalLines([
      { accountId: "cash", debitMinor: 100_000, creditMinor: 0 },
      { accountId: "revenue", debitMinor: 0, creditMinor: 99_999 },
    ]);

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "UNBALANCED_ENTRY");
  });

  it("rejects a line containing both debit and credit", () => {
    const result = validateJournalLines([
      { accountId: "cash", debitMinor: 100, creditMinor: 100 },
      { accountId: "revenue", debitMinor: 0, creditMinor: 100 },
    ]);

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "INVALID_AMOUNT");
  });

  it("builds deterministic account totals", () => {
    const trial = buildTrialBalance([
      { accountId: "1000", debitMinor: 50_000, creditMinor: 0 },
      { accountId: "4000", debitMinor: 0, creditMinor: 50_000 },
      { accountId: "1000", debitMinor: 25_000, creditMinor: 0 },
      { accountId: "4000", debitMinor: 0, creditMinor: 25_000 },
    ]);

    assert.deepEqual(trial, [
      { accountId: "1000", debitMinor: 75_000, creditMinor: 0, netMinor: 75_000 },
      { accountId: "4000", debitMinor: 0, creditMinor: 75_000, netMinor: -75_000 },
    ]);
  });
});
