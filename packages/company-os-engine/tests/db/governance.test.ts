import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { A, B, U, admin, as, createDb, denied, peek, run, seed, type Db, type Who } from "./harness";

let db: Db;
before(async () => {
  db = await createDb();
  await seed(db);
});
after(async () => db.close());

let seq = 0;
type LedgerOpts = {
  org?: string;
  who?: Who;
  uid?: string;
  type: string;
  risk?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  requiresApproval?: boolean;
  distinct?: boolean;
  kind?: "user" | "agent";
  expires?: string;
  input?: Record<string, unknown>;
};

async function propose(o: LedgerOpts): Promise<string> {
  const who = o.who ?? as.adminA;
  const uid = o.uid ?? who.uid!;
  const rows = await run<{ id: string }>(
    db,
    who,
    `insert into rinpo_actions (organization_id, user_id, action_type, input, status, source_domain, idempotency_key, risk_level, payload_hash, requires_approval, distinct_approver, approver_permission, expires_at, actor_kind)
     values ($1,$2,$3,$4::jsonb,'pending','company-os',$5,$6,$7,$8,$9,'approvals.decide',$10,$11) returning id`,
    [o.org ?? A.org, uid, o.type, JSON.stringify(o.input ?? { n: seq }), `idem-${++seq}`, o.risk ?? "HIGH", `hash-${seq}`, o.requiresApproval ?? true, o.distinct ?? true, o.expires ?? new Date(Date.now() + 3600_000).toISOString(), o.kind ?? "user"]
  );
  return rows[0].id;
}

const approve = (id: string, who: Who) => run(db, who, "update rinpo_actions set status='approved', approved_by=$2, resolved_at=now() where id=$1 returning id", [id, who.uid]);
/** Returns a refusal reason: a DB exception, or "0 rows" when RLS hides the row from the UPDATE. null = it went through. */
async function tryApprove(id: string, who: Who): Promise<string | null> {
  try {
    const rows = await peek(db, who, "update rinpo_actions set status='approved', approved_by=$2, resolved_at=now() where id=$1 returning id", [id, who.uid]);
    return rows.length === 0 ? "0 rows (invisible to this user)" : null;
  } catch (e) {
    return (e as Error).message;
  }
}

describe("ledger creation rules", () => {
  it("only pending rows with full governance fields can be created; HIGH/CRITICAL must require approval", async () => {
    const ins = (status: string, risk: string, req: boolean | null, extra = "") =>
      denied(db, as.adminA, `insert into rinpo_actions (organization_id, user_id, action_type, status, source_domain, idempotency_key, risk_level, payload_hash, requires_approval, actor_kind ${extra ? ", approved_by" : ""}) values ($1,$2,'invoice.issue',$3,'company-os',$4,$5,'h',$6,'user' ${extra ? ", $2" : ""})`, [A.org, U.adminA, status, `k-${++seq}`, risk, req]);
    assert.match((await ins("approved", "HIGH", true)) ?? "FAIL", /created pending|row-level security/i);
    assert.match((await ins("pending", "HIGH", false)) ?? "FAIL", /must require approval/i);
    assert.match((await ins("pending", "CRITICAL", false)) ?? "FAIL", /must require approval/i);
    assert.match((await ins("pending", "HIGH", true, "x")) ?? "FAIL", /approved_by cannot be set/i);
    assert.match((await ins("pending", "LOW", null)) ?? "FAIL", /missing required governance|not-null/i);
    assert.equal(await ins("pending", "LOW", false), null);
  });

  it("idempotency keys are unique per organisation", async () => {
    await propose({ type: "task.create", risk: "LOW", requiresApproval: false });
    const key = `dup-${++seq}`;
    const ins = (org: string, who: Who) => denied(db, who, `insert into rinpo_actions (organization_id, user_id, action_type, status, source_domain, idempotency_key, risk_level, payload_hash, requires_approval, actor_kind) values ($1,$2,'task.create','pending','company-os',$3,'LOW','h',false,'user')`, [org, who.uid, key]);
    assert.equal(await ins(A.org, as.adminA), null);
    await run(db, as.adminA, `insert into rinpo_actions (organization_id, user_id, action_type, status, source_domain, idempotency_key, risk_level, payload_hash, requires_approval, actor_kind) values ($1,$2,'task.create','pending','company-os',$3,'LOW','h',false,'user')`, [A.org, U.adminA, key]);
    assert.match((await ins(A.org, as.adminA)) ?? "FAIL", /duplicate key|unique/i);
    assert.equal(await ins(B.org, as.adminB), null, "same key in another tenant is fine");
  });

  it("a member cannot create a ledger row on behalf of another user or another tenant", async () => {
    const e1 = await denied(db, as.staffA, `insert into rinpo_actions (organization_id, user_id, action_type, status, source_domain, idempotency_key, risk_level, payload_hash, requires_approval, actor_kind) values ($1,$2,'task.create','pending','company-os','x1','LOW','h',false,'user')`, [A.org, U.adminA]);
    assert.match(e1 ?? "FAIL", /row-level security/i);
    const e2 = await denied(db, as.staffA, `insert into rinpo_actions (organization_id, user_id, action_type, status, source_domain, idempotency_key, risk_level, payload_hash, requires_approval, actor_kind) values ($1,$2,'task.create','pending','company-os','x2','LOW','h',false,'user')`, [B.org, U.staffA]);
    assert.match(e2 ?? "FAIL", /row-level security/i);
  });
});

describe("approval state machine", () => {
  it("the requester can NEVER approve their own HIGH action (even an admin, even via direct SQL)", async () => {
    const id = await propose({ type: "invoice.issue", who: as.adminA });
    assert.match((await tryApprove(id, as.adminA)) ?? "FAIL", /cannot approve their own/i);
  });

  it("a distinct approver with approvals.decide can approve; the row records who", async () => {
    const id = await propose({ type: "invoice.issue", who: as.adminA });
    assert.equal((await approve(id, as.adminA2)).length, 1);
    const row = (await admin<{ status: string; approved_by: string }>(db, "select status, approved_by from rinpo_actions where id=$1", [id]))[0];
    assert.deepEqual(row, { status: "approved", approved_by: U.adminA2 });
  });

  it("approved_by must be the approving user (cannot attribute approval to someone else)", async () => {
    const id = await propose({ type: "invoice.issue", who: as.adminA });
    const err = await denied(db, as.adminA2, "update rinpo_actions set status='approved', approved_by=$2 where id=$1", [id, U.founderA]);
    assert.match(err ?? "FAIL", /approved_by must be the approving user/i);
  });

  it("users without approvals.decide cannot approve (staff, client); other tenants cannot even see the row", async () => {
    const id = await propose({ type: "invoice.issue", who: as.adminA });
    assert.ok(await tryApprove(id, as.staffA));
    assert.ok(await tryApprove(id, as.clientA));
    const cross = await peek(db, as.adminB, "update rinpo_actions set status='approved', approved_by=$2 where id=$1 returning id", [id, U.adminB]);
    assert.equal(cross.length, 0, "cross-tenant approval is impossible (row invisible)");
  });

  it("CRITICAL actions require an admin/founder approver: a manager with approvals.decide is refused", async () => {
    const id = await propose({ type: "contract.sign", risk: "CRITICAL", who: as.adminA });
    assert.match((await tryApprove(id, as.managerA)) ?? "FAIL", /admin or founder/i);
    assert.equal((await approve(id, as.founderA)).length, 1);
  });

  it("an AI-prepared proposal can be approved by the human it was prepared for, but never self-executes", async () => {
    const id = await propose({ type: "task.assign", risk: "MEDIUM", requiresApproval: true, who: as.managerA, kind: "agent", distinct: false });
    const err = await denied(db, as.managerA, "update rinpo_actions set status='executed' where id=$1", [id]);
    assert.match(err ?? "FAIL", /requires approval cannot execute while pending/i);
    assert.equal((await approve(id, as.managerA)).length, 1);
  });

  it("expired requests cannot be approved", async () => {
    const id = await propose({ type: "invoice.issue", who: as.adminA, expires: new Date(Date.now() - 1000).toISOString() });
    assert.match((await tryApprove(id, as.adminA2)) ?? "FAIL", /expired/i);
  });

  it("the payload, hash, risk and policy fields are immutable after creation (no tampering)", async () => {
    const id = await propose({ type: "payment.record", who: as.adminA });
    for (const sql of [
      "update rinpo_actions set input = '{\"amount\":1}'::jsonb where id=$1",
      "update rinpo_actions set payload_hash = 'other' where id=$1",
      "update rinpo_actions set risk_level = 'LOW' where id=$1",
      "update rinpo_actions set requires_approval = false where id=$1",
      "update rinpo_actions set distinct_approver = false where id=$1",
      "update rinpo_actions set action_type = 'task.create' where id=$1",
      "update rinpo_actions set user_id = $2 where id=$1",
      "update rinpo_actions set expires_at = now() + interval '30 days' where id=$1",
    ]) {
      const err = await denied(db, as.adminA, sql, sql.includes("$2") ? [id, U.adminA2] : [id]);
      assert.match(err ?? `FAIL (allowed): ${sql}`, /immutable|row-level security/i, sql);
    }
  });

  it("terminal rows are final; rejection carries no approver", async () => {
    const id = await propose({ type: "invoice.issue", who: as.adminA });
    assert.match((await denied(db, as.adminA2, "update rinpo_actions set status='rejected', approved_by=$2 where id=$1", [id, U.adminA2])) ?? "FAIL", /no approver/i);
    await run(db, as.adminA2, "update rinpo_actions set status='rejected', reason='no' where id=$1", [id]);
    assert.match((await denied(db, as.adminA2, "update rinpo_actions set status='approved', approved_by=$2 where id=$1", [id, U.adminA2])) ?? "FAIL", /final/i);
  });

  it("only the approver (or requester) may finish an approved action; the approver cannot be swapped", async () => {
    const id = await propose({ type: "invoice.issue", who: as.adminA });
    await approve(id, as.adminA2);
    assert.match((await denied(db, as.managerA, "update rinpo_actions set status='executed' where id=$1", [id])) ?? "FAIL", /row-level security|only the approver/i);
    assert.match((await denied(db, as.adminA2, "update rinpo_actions set status='executed', approved_by=$2 where id=$1", [id, U.founderA])) ?? "FAIL", /cannot change/i);
    assert.equal((await run(db, as.adminA2, "update rinpo_actions set status='executed', output='{\"ok\":true}'::jsonb, executed_at=now() where id=$1 returning id", [id])).length, 1);
  });

  it("self-service (no-approval) actions are completed only by their requester", async () => {
    const id = await propose({ type: "task.create", risk: "LOW", requiresApproval: false, who: as.staffA });
    assert.ok(await denied(db, as.adminA, "update rinpo_actions set status='executed' where id=$1", [id]));
    assert.equal((await run(db, as.staffA, "update rinpo_actions set status='executed', executed_at=now() where id=$1 returning id", [id])).length, 1);
  });
});

describe("ledger visibility", () => {
  it("clients cannot read Company OS payloads; the requester can; queue readers can; other tenants cannot", async () => {
    const id = await propose({ type: "payment.record", who: as.adminA, input: { amount: 99999, invoiceId: "secret" } });
    assert.equal((await peek(db, as.clientA, "select * from rinpo_actions where id=$1", [id])).length, 0);
    assert.equal((await peek(db, as.viewerA, "select * from rinpo_actions where id=$1", [id])).length, 0);
    assert.equal((await peek(db, as.staffA, "select * from rinpo_actions where id=$1", [id])).length, 1, "approvals.read");
    assert.equal((await peek(db, as.adminA, "select * from rinpo_actions where id=$1", [id])).length, 1);
    assert.equal((await peek(db, as.staffB, "select * from rinpo_actions where id=$1", [id])).length, 0);
  });

  it("legacy (non company-os) rinpo_actions rows keep their old member-wide visibility", async () => {
    await admin(db, "insert into rinpo_actions (organization_id, user_id, action_type, status) values ($1,$2,'salon.legacy','pending')", [A.org, U.staffA]);
    assert.ok((await peek(db, as.clientA, "select * from rinpo_actions where action_type='salon.legacy'")).length >= 1);
  });
});

describe("database-enforced approval gates for high-risk writes", () => {
  let invoiceId: string;
  let companyId: string;
  before(async () => {
    companyId = (await admin<{ id: string }>(db, "insert into cos_companies (organization_id, name) values ($1,'Gate Co') returning id", [A.org]))[0].id;
    invoiceId = (await admin<{ id: string }>(db, "insert into cos_invoices (organization_id, number, company_id, amount, status, issued_at, due_at, issue_action_id) values ($1,'G-1',$2,1000,'draft', current_date, current_date + 30, null) returning id", [A.org, companyId]))[0].id;
  });

  const pay = (who: Who, action: string | null, ref = `r-${++seq}`) =>
    denied(db, who, "insert into cos_payments (organization_id, invoice_id, amount, approved_action_id, reference) values ($1,$2,100,$3,$4)", [A.org, invoiceId, action, ref]);

  it("a payment cannot be recorded without an approved payment.record ledger row", async () => {
    assert.ok(await pay(as.adminA, null));
    const pending = await propose({ type: "payment.record", who: as.adminA });
    assert.match((await pay(as.adminA, pending)) ?? "FAIL", /row-level security/i, "pending is not approved");
    const wrongType = await propose({ type: "invoice.issue", who: as.adminA });
    await approve(wrongType, as.adminA2);
    assert.match((await pay(as.adminA, wrongType)) ?? "FAIL", /row-level security/i, "approval for a different action does not count");
  });

  it("an approval from another tenant cannot authorise a payment here", async () => {
    const foreign = await propose({ type: "payment.record", who: as.adminB, org: B.org });
    await run(db, { uid: U.adminB }, "update rinpo_actions set status='approved', approved_by=$2 where id=$1", [foreign, U.adminB]).catch(() => undefined);
    assert.match((await pay(as.adminA, foreign)) ?? "FAIL", /row-level security/i);
  });

  it("with a genuine approval the payment is recorded exactly once and is immutable", async () => {
    const id = await propose({ type: "payment.record", who: as.adminA });
    await approve(id, as.adminA2);
    const rows = await run<{ id: string }>(db, as.adminA, "insert into cos_payments (organization_id, invoice_id, amount, approved_action_id, reference) values ($1,$2,100,$3,'real-1') returning id", [A.org, invoiceId, id]);
    assert.equal(rows.length, 1);
    assert.match((await pay(as.adminA, id, "real-2")) ?? "FAIL", /duplicate key|unique/i, "one approval authorises one payment");
    assert.match((await denied(db, as.adminA, "update cos_payments set amount = 1")) ?? "FAIL", /permission denied/i);
    assert.match((await denied(db, as.adminA, "delete from cos_payments")) ?? "FAIL", /permission denied/i);
    assert.match((await denied(db, as.managerA, "insert into cos_payments (organization_id, invoice_id, amount, approved_action_id) values ($1,$2,1,$3)", [A.org, invoiceId, id])) ?? "FAIL", /row-level security/i, "managers lack finance.write");
  });

  it("an invoice cannot leave draft, and an issued invoice cannot be voided, without the matching approvals", async () => {
    const upd = (who: Who, status: string, issue: string | null, voidA: string | null = null) =>
      denied(db, who, "update cos_invoices set status=$2, issue_action_id=$3, void_action_id=$4 where id=$1", [invoiceId, status, issue, voidA]);
    assert.match((await upd(as.adminA, "sent", null)) ?? "FAIL", /row-level security/i);
    const issue = await propose({ type: "invoice.issue", who: as.adminA });
    await approve(issue, as.adminA2);
    await run(db, as.adminA, "update cos_invoices set status='sent', issue_action_id=$2 where id=$1", [invoiceId, issue]);
    assert.match((await upd(as.adminA, "void", issue)) ?? "FAIL", /row-level security/i, "void needs its own approval");
    const voidId = await propose({ type: "invoice.void", who: as.adminA });
    await approve(voidId, as.adminA2);
    assert.equal(await upd(as.adminA, "void", issue, voidId), null);
  });

  it("a contract cannot be marked signed without an approved contract.sign (CRITICAL) action", async () => {
    const contract = (await admin<{ id: string }>(db, "insert into cos_contracts (organization_id, company_id, title, status) values ($1,$2,'MSA','sent') returning id", [A.org, companyId]))[0].id;
    const sign = async (who: Who, action: string | null): Promise<string | null> => {
      try {
        const rows = await peek(db, who, "update cos_contracts set status='signed', signed_at=now(), sign_action_id=$2 where id=$1 returning id", [contract, action]);
        return rows.length === 0 ? "0 rows (row-level security hides it)" : null;
      } catch (e) {
        return (e as Error).message;
      }
    };
    assert.match((await sign(as.adminA, null)) ?? "FAIL", /row-level security/i);
    const pending = await propose({ type: "contract.sign", risk: "CRITICAL", who: as.adminA });
    assert.match((await sign(as.adminA, pending)) ?? "FAIL", /row-level security/i);
    await approve(pending, as.founderA);
    assert.equal(await sign(as.adminA, pending), null);
    assert.match((await sign(as.staffA, pending)) ?? "FAIL", /0 rows|row-level security/i, "an approved action does not let a user without clients.write write");
    assert.equal(await sign(as.managerA, pending), null, "approval gates the action; clients.write gates who may perform it");
  });

  it("a proposal cannot be sent and content cannot be published without approved actions", async () => {
    const prop = (await admin<{ id: string }>(db, "insert into cos_proposals (organization_id, company_id, title) values ($1,$2,'P1') returning id", [A.org, companyId]))[0].id;
    assert.match((await denied(db, as.managerA, "update cos_proposals set status='sent', sent_at=now() where id=$1", [prop])) ?? "FAIL", /row-level security/i);
    const send = await propose({ type: "proposal.send", who: as.managerA, risk: "HIGH" });
    await approve(send, as.adminA);
    assert.equal(await denied(db, as.managerA, "update cos_proposals set status='sent', sent_at=now(), sent_action_id=$2 where id=$1", [prop, send]), null);

    const idea = (await admin<{ id: string }>(db, "insert into content_items (organization_id, source_idea_id, channel, title) values ($1, gen_random_uuid(), 'instagram', 'Teaser') returning id", [A.org]))[0].id;
    assert.match((await denied(db, as.managerA, "update content_items set status='published', published_at=now() where id=$1", [idea])) ?? "FAIL", /row-level security/i);
    const pub = await propose({ type: "content.publish", who: as.managerA });
    await approve(pub, as.adminA);
    assert.equal(await denied(db, as.managerA, "update content_items set status='published', published_at=now(), publish_action_id=$2 where id=$1", [idea, pub]), null);
  });

  it("an ad budget cannot change without a NEW approved ads.budget_change action", async () => {
    const ad = (await admin<{ id: string }>(db, "insert into ad_campaigns (organization_id, platform, name, status) values ($1,'meta','Spring','paused') returning id", [A.org]))[0].id;
    const setBudget = (who: Who, b: number, action: string | null) => denied(db, who, "update ad_campaigns set daily_budget=$2, budget_action_id=$3 where id=$1", [ad, b, action]);
    assert.match((await setBudget(as.managerA, 500, null)) ?? "FAIL", /requires a new approved/i);
    const a1 = await propose({ type: "ads.budget_change", who: as.managerA });
    await approve(a1, as.adminA);
    assert.equal(await setBudget(as.managerA, 500, a1), null);
    await run(db, as.managerA, "update ad_campaigns set daily_budget=500, budget_action_id=$2 where id=$1", [ad, a1]);
    assert.match((await setBudget(as.managerA, 900, a1)) ?? "FAIL", /requires a new approved/i, "an approval cannot be replayed for a second change");
    assert.equal((await peek(db, as.managerA, "update ad_campaigns set name='renamed' where id=$1 returning id", [ad])).length, 1, "non-budget edits are unaffected");
  });
});

describe("events and audit cannot be forged from a member session", () => {
  const ev = (who: Who, actorType: string, actorId: string, meta = "{}") =>
    denied(db, who, "insert into business_events (organization_id, event_type, payload, source, actor_type, actor_id, metadata, idempotency_key) values ($1,'task.created.v1','{}'::jsonb,'company-os',$2,$3,$4::jsonb,$5)", [A.org, actorType, actorId, meta, `ev-${++seq}`]);

  it("a member can write their own Company OS events but not someone else's, nor non-company-os sources", async () => {
    assert.equal(await ev(as.staffA, "user", U.staffA), null);
    assert.match((await ev(as.staffA, "user", U.adminA)) ?? "FAIL", /row-level security/i);
    assert.match((await ev(as.staffA, "system", "company-os")) ?? "FAIL", /row-level security/i);
    assert.equal(await ev(as.managerA, "ai", "ads_manager", JSON.stringify({ onBehalfOf: U.managerA })), null);
    assert.match((await ev(as.managerA, "ai", "ads_manager", JSON.stringify({ onBehalfOf: U.adminA }))) ?? "FAIL", /row-level security/i);
    const other = await denied(db, as.staffA, "insert into business_events (organization_id, event_type, payload, source, actor_type, actor_id) values ($1,'order.paid.v1','{}'::jsonb,'system','user',$2)", [A.org, U.staffA]);
    assert.match(other ?? "FAIL", /row-level security/i, "legacy event sources stay service-only");
  });

  it("company-os events are readable only with reports.read", async () => {
    await run(db, as.staffA, "insert into business_events (organization_id, event_type, payload, source, actor_type, actor_id, idempotency_key) values ($1,'lead.created.v1','{}'::jsonb,'company-os','user',$2,'ev-read')", [A.org, U.staffA]);
    assert.equal((await peek(db, as.staffA, "select * from business_events where source='company-os'")).length, 0, "staff lack reports.read");
    assert.ok((await peek(db, as.adminA, "select * from business_events where source='company-os'")).length >= 1);
    assert.equal((await peek(db, as.adminB, "select * from business_events where source='company-os'")).length, 0);
  });

  it("audit rows tagged company-os must be authored as the caller (or an agent acting for them)", async () => {
    const audit = (who: Who, actorId: string, approvedBy: string | null = null) =>
      denied(db, who, "insert into audit_logs (organization_id, actor_type, actor_id, action, entity, source, approved_by) values ($1,'user',$2,'company-os.action.executed','x','company-os',$3)", [A.org, actorId, approvedBy]);
    assert.equal(await audit(as.staffA, U.staffA), null);
    assert.match((await audit(as.staffA, U.adminA)) ?? "FAIL", /row-level security/i);
    assert.equal(await audit(as.staffA, `agent:ads_manager:${U.staffA}`), null);
    assert.match((await audit(as.staffA, `agent:ads_manager:${U.adminA}`)) ?? "FAIL", /row-level security/i);
    assert.match((await audit(as.staffA, U.staffA, U.adminA)) ?? "FAIL", /row-level security/i, "cannot claim someone else approved");
  });
});

void [peek, B];
