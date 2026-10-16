import { CONTRACT_MACHINE, LEAD_MACHINE, OPPORTUNITY_MACHINE, PROPOSAL_MACHINE, canTransition, type DomainTool } from "@rinads/company-os-engine";
import {
  PartialWriteError,
  ToolError,
  afterWrite,
  defineTool,
  evt,
  insertOne,
  mustRead,
  nowIso,
  readMany,
  updateOne,
  verifyRow,
  type Env,
} from "../kit";
import { compact, date, num, oneOf, reqStr, reqUuid, str, uuid } from "../validate";

const OPP_STAGES = ["discovery", "solution", "proposal", "negotiation", "won", "lost"] as const;
const REL = ["prospect", "client", "partner", "churned"] as const;
const PRIORITY = ["strategic", "standard", "low"] as const;
const KIND = ["new", "renewal", "upsell"] as const;

export function crmTools(env: Env): DomainTool[] {
  return [
    defineTool(
      {
        key: "lead.create",
        async run(ctx, input) {
          const row = await insertOne(env, "crm_leads", {
            organization_id: ctx.organizationId,
            name: reqStr(input, "name", { max: 200 }),
            email: str(input, "email", { optional: true, max: 320 }),
            phone: str(input, "phone", { optional: true, max: 40 }),
            company_name: str(input, "companyName", { optional: true, max: 200 }),
            source: str(input, "source", { optional: true, max: 60 }) ?? "manual",
            source_ref: str(input, "sourceRef", { optional: true, max: 120 }),
            problem: str(input, "problem", { optional: true, max: 4000 }),
            budget: str(input, "budget", { optional: true, max: 120 }),
            timeline: str(input, "timeline", { optional: true, max: 120 }),
            owner_id: uuid(input, "ownerId", true),
          });
          return { id: row.id, name: row.name };
        },
        async verify(ctx, input, out) {
          await verifyRow(env, "crm_leads", ctx.organizationId, String(out.id), { status: "new", name: out.name });
        },
        events: (ctx, _i, out) => [evt(ctx, "lead.created.v1", "crm_lead", String(out.id), { name: out.name })],
      },
      env
    ),

    defineTool(
      {
        key: "lead.qualify",
        async run(ctx, input) {
          const id = reqUuid(input, "leadId");
          const to = oneOf(input, "status", ["contacted", "qualified", "disqualified"] as const)!;
          const lead = await mustRead(env, "crm_leads", ctx.organizationId, id, "Lead");
          const t = canTransition(LEAD_MACHINE, lead.status as never, to);
          if (!t.ok) throw new ToolError(t.reason, "invalid_transition");
          const now = nowIso(env);
          const patch = compact({
            status: to,
            last_contacted_at: to === "contacted" || to === "qualified" ? now : undefined,
            disqualified_reason: to === "disqualified" ? reqStr(input, "reason", { max: 500 }) : undefined,
          });
          await updateOne(env, "crm_leads", ctx.organizationId, id, patch);
          return { id, from: lead.status, status: to };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "crm_leads", ctx.organizationId, String(out.id), { status: out.status });
        },
        events: (ctx, _i, out) => (out.status === "qualified" ? [evt(ctx, "lead.qualified.v1", "crm_lead", String(out.id))] : []),
      },
      env
    ),

    defineTool(
      {
        key: "company.create",
        async run(ctx, input) {
          const name = reqStr(input, "name", { max: 200 });
          const existing = await readMany(env, "crm_companies", { organization_id: ctx.organizationId, name }, "id,name", 1);
          if (existing[0]) return { id: existing[0].id, name, existed: true };
          const row = await insertOne(env, "crm_companies", {
            organization_id: ctx.organizationId,
            name,
            relationship: oneOf(input, "relationship", REL, true) ?? "prospect",
            priority: oneOf(input, "priority", PRIORITY, true) ?? "standard",
            industry: str(input, "industry", { optional: true, max: 120 }),
            website: str(input, "website", { optional: true, max: 300 }),
            company_size: str(input, "companySize", { optional: true, max: 60 }),
            owner_id: uuid(input, "ownerId", true),
            notes: str(input, "notes", { optional: true, max: 4000 }),
          });
          return { id: row.id, name, existed: false };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "crm_companies", ctx.organizationId, String(out.id), { name: out.name });
        },
      },
      env
    ),

    defineTool(
      {
        key: "contact.create",
        async run(ctx, input) {
          const companyId = uuid(input, "companyId", true);
          if (companyId) await mustRead(env, "crm_companies", ctx.organizationId, companyId, "Company", "id");
          const row = await insertOne(env, "crm_contacts", {
            organization_id: ctx.organizationId,
            company_id: companyId,
            full_name: reqStr(input, "fullName", { max: 200 }),
            email: str(input, "email", { optional: true, max: 320 }),
            phone: str(input, "phone", { optional: true, max: 40 }),
            role_title: str(input, "roleTitle", { optional: true, max: 120 }),
            is_primary: input.isPrimary === true,
          });
          return { id: row.id, fullName: row.full_name };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "crm_contacts", ctx.organizationId, String(out.id), { full_name: out.fullName });
        },
      },
      env
    ),

    defineTool(
      {
        key: "opportunity.create",
        async run(ctx, input) {
          const companyId = uuid(input, "companyId", true);
          const contactId = uuid(input, "contactId", true);
          if (companyId) await mustRead(env, "crm_companies", ctx.organizationId, companyId, "Company", "id");
          if (contactId) await mustRead(env, "crm_contacts", ctx.organizationId, contactId, "Contact", "id");
          const row = await insertOne(env, "crm_opportunities", {
            organization_id: ctx.organizationId,
            company_id: companyId,
            contact_id: contactId,
            title: reqStr(input, "title", { max: 200 }),
            kind: oneOf(input, "kind", KIND, true) ?? "new",
            amount: num(input, "amount", { optional: true, min: 0 }),
            currency: str(input, "currency", { optional: true, max: 3 }) ?? "INR",
            probability: num(input, "probability", { optional: true, min: 0, max: 100, int: true }),
            expected_close_date: date(input, "expectedCloseDate"),
            owner_id: uuid(input, "ownerId", true) ?? ctx.executorUserId,
          });
          return { id: row.id, title: row.title, stage: row.stage };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "crm_opportunities", ctx.organizationId, String(out.id), { stage: "discovery", title: out.title });
        },
        events: (ctx, _i, out) => [evt(ctx, "opportunity.created.v1", "crm_opportunity", String(out.id))],
      },
      env
    ),

    defineTool(
      {
        key: "opportunity.advance",
        async run(ctx, input) {
          const id = reqUuid(input, "opportunityId");
          const to = oneOf(input, "toStage", OPP_STAGES)!;
          const opp = await mustRead(env, "crm_opportunities", ctx.organizationId, id, "Opportunity");
          const t = canTransition(OPPORTUNITY_MACHINE, opp.stage as never, to);
          if (!t.ok) throw new ToolError(t.reason, "invalid_transition");
          if (to === "lost" && !str(input, "lostReason", { optional: true })) throw new ToolError("A reason is required when marking an opportunity lost.");
          await updateOne(
            env,
            "crm_opportunities",
            ctx.organizationId,
            id,
            compact({
              stage: to,
              stage_changed_at: nowIso(env),
              lost_reason: to === "lost" ? str(input, "lostReason", { max: 500 }) : undefined,
              probability: num(input, "probability", { optional: true, min: 0, max: 100, int: true }),
              amount: num(input, "amount", { optional: true, min: 0 }),
            })
          );
          return { id, from: opp.stage, stage: to };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "crm_opportunities", ctx.organizationId, String(out.id), { stage: out.stage });
        },
        events: (ctx, _i, out) => [evt(ctx, "opportunity.stage_changed.v1", "crm_opportunity", String(out.id), { from: out.from, to: out.stage })],
      },
      env
    ),

    // Lead → company + contact + opportunity. Progress is persisted on the lead after every step,
    // so a retry (with a fresh idempotency key) resumes instead of duplicating.
    defineTool(
      {
        key: "lead.convert",
        async run(ctx, input) {
          const leadId = reqUuid(input, "leadId");
          const lead = await mustRead(env, "crm_leads", ctx.organizationId, leadId, "Lead");
          if (lead.status === "converted" && lead.converted_opportunity_id) {
            return { leadId, companyId: lead.converted_company_id, contactId: lead.converted_contact_id, opportunityId: lead.converted_opportunity_id, resumed: true };
          }
          if (lead.status !== "qualified") {
            throw new ToolError("Only a qualified lead can be converted.", "invalid_transition");
          }
          const companyName = str(input, "companyName", { optional: true, max: 200 }) ?? (lead.company_name as string | null) ?? (lead.name as string);
          const opportunityTitle = str(input, "opportunityTitle", { optional: true, max: 200 }) ?? `${companyName} — new engagement`;

          let companyId = lead.converted_company_id as string | null;
          if (!companyId) {
            const found = await readMany(env, "crm_companies", { organization_id: ctx.organizationId, name: companyName }, "id", 1);
            companyId = found[0] ? String(found[0].id) : String((await insertOne(env, "crm_companies", { organization_id: ctx.organizationId, name: companyName, relationship: "prospect", owner_id: (lead.owner_id as string | null) ?? ctx.executorUserId })).id);
            await updateOne(env, "crm_leads", ctx.organizationId, leadId, { converted_company_id: companyId });
          }
          const cid = companyId;

          let contactId = lead.converted_contact_id as string | null;
          if (!contactId) {
            contactId = await afterWrite(async () => {
              const existing = lead.email ? await readMany(env, "crm_contacts", { organization_id: ctx.organizationId, company_id: cid, email: lead.email as string }, "id", 1) : [];
              const id = existing[0]
                ? String(existing[0].id)
                : String((await insertOne(env, "crm_contacts", { organization_id: ctx.organizationId, company_id: cid, full_name: lead.name, email: lead.email, phone: lead.phone, is_primary: true })).id);
              await updateOne(env, "crm_leads", ctx.organizationId, leadId, { converted_contact_id: id });
              return id;
            }, "Creating the contact");
          }
          const contact = contactId;

          const opportunityId = await afterWrite(async () => {
            const opp = await insertOne(env, "crm_opportunities", {
              organization_id: ctx.organizationId,
              company_id: cid,
              contact_id: contact,
              title: opportunityTitle,
              amount: num(input, "amount", { optional: true, min: 0 }),
              owner_id: (lead.owner_id as string | null) ?? ctx.executorUserId,
            });
            await updateOne(env, "crm_leads", ctx.organizationId, leadId, { converted_opportunity_id: opp.id, status: "converted" });
            return String(opp.id);
          }, "Creating the opportunity");

          return { leadId, companyId, contactId, opportunityId, resumed: false };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "crm_leads", ctx.organizationId, String(out.leadId), {
            status: "converted",
            converted_company_id: out.companyId,
            converted_contact_id: out.contactId,
            converted_opportunity_id: out.opportunityId,
          });
          await verifyRow(env, "crm_opportunities", ctx.organizationId, String(out.opportunityId), { company_id: out.companyId, contact_id: out.contactId });
        },
        events: (ctx, _i, out) => [
          evt(ctx, "lead.converted.v1", "crm_lead", String(out.leadId), { companyId: out.companyId, opportunityId: out.opportunityId }),
          evt(ctx, "opportunity.created.v1", "crm_opportunity", String(out.opportunityId)),
        ],
      },
      env
    ),

    // Website form leads → CRM. Source is injected server-side (read-only); absent ⇒ fail closed.
    defineTool(
      {
        key: "lead.import_site",
        async run(ctx, input) {
          if (!env.siteLeads) throw new ToolError("Website lead import is not configured for this environment.", "not_configured");
          const limit = num(input, "limit", { optional: true, min: 1, max: 100, int: true }) ?? 50;
          const recent = await env.siteLeads.fetchRecent(limit);
          if (recent.length === 0) return { imported: 0, alreadyPresent: 0, ids: [] as string[] };
          const present = await readMany(env, "crm_leads", { organization_id: ctx.organizationId, source_ref: { in: recent.map((r) => r.id) } }, "source_ref", 1000);
          const have = new Set(present.map((p) => String(p.source_ref)));
          const fresh = recent.filter((r) => !have.has(r.id));
          const ids: string[] = [];
          for (const r of fresh) {
            const row = await afterWrite(
              () =>
                insertOne(env, "crm_leads", {
                  organization_id: ctx.organizationId,
                  name: r.name,
                  email: r.work_email,
                  company_name: r.company,
                  source: "website",
                  source_ref: r.id,
                  problem: r.problem,
                  budget: r.budget,
                  timeline: r.timeline,
                }),
              "Importing website leads"
            ).catch((e) => {
              if (e instanceof PartialWriteError && ids.length === 0) throw new ToolError(e.message.replace(/^.*?: /, ""), "write_rejected");
              throw e;
            });
            ids.push(String(row.id));
          }
          return { imported: ids.length, alreadyPresent: have.size, ids };
        },
        async verify(ctx, _i, out) {
          const ids = out.ids as string[];
          if (ids.length === 0) return;
          const rows = await readMany(env, "crm_leads", { organization_id: ctx.organizationId, id: { in: ids } }, "id", ids.length);
          if (rows.length !== ids.length) throw new ToolError(`Expected ${ids.length} imported leads, found ${rows.length}`, "verification_error");
        },
        events: (ctx, _i, out) => (out.ids as string[]).map((id) => evt(ctx, "lead.created.v1", "crm_lead", id, { source: "website" })),
      },
      env
    ),

    defineTool(
      {
        key: "proposal.create",
        async run(ctx, input) {
          const opportunityId = uuid(input, "opportunityId", true);
          const companyId = uuid(input, "companyId", true);
          if (opportunityId) await mustRead(env, "crm_opportunities", ctx.organizationId, opportunityId, "Opportunity", "id");
          if (companyId) await mustRead(env, "crm_companies", ctx.organizationId, companyId, "Company", "id");
          const row = await insertOne(env, "crm_proposals", {
            organization_id: ctx.organizationId,
            opportunity_id: opportunityId,
            company_id: companyId,
            title: reqStr(input, "title", { max: 200 }),
            amount: num(input, "amount", { optional: true, min: 0 }),
            valid_until: date(input, "validUntil"),
            document_ref: str(input, "documentRef", { optional: true, max: 500 }),
          });
          return { id: row.id, title: row.title };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "crm_proposals", ctx.organizationId, String(out.id), { status: "draft" });
        },
      },
      env
    ),

    // HIGH risk — runs only after an approved ledger row (enforced in the pipeline AND the database).
    defineTool(
      {
        key: "proposal.send",
        async run(ctx, input) {
          const id = reqUuid(input, "proposalId");
          const p = await mustRead(env, "crm_proposals", ctx.organizationId, id, "Proposal");
          const t = canTransition(PROPOSAL_MACHINE, p.status as never, "sent");
          if (!t.ok) throw new ToolError(t.reason, "invalid_transition");
          if (p.amount === null || p.amount === undefined) throw new ToolError("A proposal needs an amount before it is sent.");
          await updateOne(env, "crm_proposals", ctx.organizationId, id, { status: "sent", sent_at: nowIso(env), sent_action_id: ctx.actionId });
          return { id, status: "sent", sentActionId: ctx.actionId };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "crm_proposals", ctx.organizationId, String(out.id), { status: "sent", sent_action_id: out.sentActionId });
        },
        events: (ctx, _i, out) => [evt(ctx, "proposal.sent.v1", "crm_proposal", String(out.id))],
      },
      env
    ),

    defineTool(
      {
        key: "contract.create",
        async run(ctx, input) {
          const companyId = uuid(input, "companyId", true);
          const opportunityId = uuid(input, "opportunityId", true);
          const proposalId = uuid(input, "proposalId", true);
          if (companyId) await mustRead(env, "crm_companies", ctx.organizationId, companyId, "Company", "id");
          if (opportunityId) await mustRead(env, "crm_opportunities", ctx.organizationId, opportunityId, "Opportunity", "id");
          if (proposalId) await mustRead(env, "crm_proposals", ctx.organizationId, proposalId, "Proposal", "id");
          const row = await insertOne(env, "crm_contracts", {
            organization_id: ctx.organizationId,
            company_id: companyId,
            opportunity_id: opportunityId,
            proposal_id: proposalId,
            title: reqStr(input, "title", { max: 200 }),
            contract_value: num(input, "value", { optional: true, min: 0 }),
            start_date: date(input, "startDate"),
            end_date: date(input, "endDate"),
            document_ref: str(input, "documentRef", { optional: true, max: 500 }),
          });
          return { id: row.id, title: row.title };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "crm_contracts", ctx.organizationId, String(out.id), { status: "draft" });
        },
      },
      env
    ),

    defineTool(
      {
        key: "contract.send",
        async run(ctx, input) {
          const id = reqUuid(input, "contractId");
          const c = await mustRead(env, "crm_contracts", ctx.organizationId, id, "Contract");
          const t = canTransition(CONTRACT_MACHINE, c.status as never, "sent");
          if (!t.ok) throw new ToolError(t.reason, "invalid_transition");
          if (!c.company_id) throw new ToolError("Link the contract to a company before sending it.");
          await updateOne(env, "crm_contracts", ctx.organizationId, id, { status: "sent" });
          return { id, status: "sent" };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "crm_contracts", ctx.organizationId, String(out.id), { status: "sent" });
        },
      },
      env
    ),

    // CRITICAL — admin/founder approver only. A signed contract makes the company a client.
    defineTool(
      {
        key: "contract.sign",
        async run(ctx, input) {
          const id = reqUuid(input, "contractId");
          const c = await mustRead(env, "crm_contracts", ctx.organizationId, id, "Contract");
          const t = canTransition(CONTRACT_MACHINE, c.status as never, "signed");
          if (!t.ok) throw new ToolError(t.reason, "invalid_transition");
          await updateOne(env, "crm_contracts", ctx.organizationId, id, {
            status: "signed",
            signed_at: nowIso(env),
            signed_by_name: reqStr(input, "signedByName", { max: 200 }),
            sign_action_id: ctx.actionId,
          });
          if (c.company_id) {
            await afterWrite(() => updateOne(env, "crm_companies", ctx.organizationId, String(c.company_id), { relationship: "client" }), "Marking the company as a client");
          }
          return { id, status: "signed", companyId: c.company_id ?? null, signActionId: ctx.actionId };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "crm_contracts", ctx.organizationId, String(out.id), { status: "signed", sign_action_id: out.signActionId });
          if (out.companyId) await verifyRow(env, "crm_companies", ctx.organizationId, String(out.companyId), { relationship: "client" });
        },
        events: (ctx, _i, out) => [evt(ctx, "contract.signed.v1", "crm_contract", String(out.id), { companyId: out.companyId })],
      },
      env
    ),
  ];
}
