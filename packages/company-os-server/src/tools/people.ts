import type { DomainTool } from "@rinads/company-os";
import { ToolError, defineTool, insertOne, mustRead, nowIso, readMany, updateOne, verifyRow, type Env } from "../kit";
import { InputError, num, oneOf, reqStr, reqUuid, str, uuid, type Input } from "../validate";

const STATUS = ["active", "on_leave", "inactive"] as const;
const STAGES = ["learn", "practice", "lab", "supervised_work", "evidence", "assessment", "certified"] as const;
const CHANNEL = ["call", "voice", "whatsapp", "email", "sms", "web_chat", "meeting"] as const;
const LINK_TABLE: Record<string, string> = {
  lead: "crm_leads",
  company: "crm_companies",
  contact: "crm_contacts",
  opportunity: "crm_opportunities",
  project: "projects",
  ticket: "support_tickets",
  order: "orders",
  invoice: "finance_invoices",
};

function skills(input: Input): Record<string, number> {
  const raw = input.skills;
  if (raw === undefined) return {};
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) throw new InputError("skills must be an object of skill → level (1–5)");
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!/^[a-z0-9_]{1,40}$/.test(k)) throw new InputError(`Invalid skill key "${k}"`);
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1 || n > 5) throw new InputError(`Skill level for ${k} must be 1–5`);
    out[k] = n;
  }
  return out;
}

export function peopleTools(env: Env): DomainTool[] {
  return [
    defineTool(
      {
        key: "people.update_profile",
        async run(ctx, input) {
          const userId = uuid(input, "userId", true);
          const patch = {
            display_name: reqStr(input, "displayName", { max: 200 }),
            role_title: str(input, "roleTitle", { optional: true, max: 120 }),
            status: oneOf(input, "status", STATUS, true) ?? "active",
            skills: skills(input),
            weekly_capacity_hours: num(input, "weeklyCapacityHours", { optional: true, min: 0, max: 168 }),
          };
          if (userId) {
            const member = await readMany(env, "organization_members", { organization_id: ctx.organizationId, user_id: userId, status: "active" }, "user_id", 1);
            if (!member[0]) throw new ToolError("That user is not an active member of this organisation.");
            const existing = await readMany(env, "people_profiles", { organization_id: ctx.organizationId, user_id: userId }, "id", 1);
            if (existing[0]) {
              await updateOne(env, "people_profiles", ctx.organizationId, String(existing[0].id), patch);
              return { id: existing[0].id, created: false };
            }
          }
          const row = await insertOne(env, "people_profiles", { organization_id: ctx.organizationId, user_id: userId, ...patch });
          return { id: row.id, created: true };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "people_profiles", ctx.organizationId, String(out.id), {});
        },
      },
      env
    ),

    defineTool(
      {
        key: "academy.skill_create",
        async run(ctx, input) {
          const key = reqStr(input, "skillKey", { max: 40 });
          if (!/^[a-z0-9_]+$/.test(key)) throw new InputError("skillKey must be lowercase letters, numbers and underscores");
          const existing = await readMany(env, "academy_skills", { organization_id: ctx.organizationId, skill_key: key }, "id", 1);
          if (existing[0]) return { id: existing[0].id, skillKey: key, existed: true };
          const row = await insertOne(env, "academy_skills", {
            organization_id: ctx.organizationId,
            skill_key: key,
            name: reqStr(input, "name", { max: 120 }),
            description: str(input, "description", { optional: true, max: 1000 }),
          });
          return { id: row.id, skillKey: key, existed: false };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "academy_skills", ctx.organizationId, String(out.id), { skill_key: out.skillKey });
        },
      },
      env
    ),

    // Advisory evidence only. Certification may inform skill eligibility; it never makes an employment decision.
    defineTool(
      {
        key: "academy.record_progress",
        async run(ctx, input) {
          const userId = reqUuid(input, "userId");
          const skillId = reqUuid(input, "skillId");
          const stage = oneOf(input, "stage", STAGES)!;
          await mustRead(env, "academy_skills", ctx.organizationId, skillId, "Skill", "id");
          const member = await readMany(env, "organization_members", { organization_id: ctx.organizationId, user_id: userId, status: "active" }, "user_id", 1);
          if (!member[0]) throw new ToolError("That learner is not an active member of this organisation.");
          const note = str(input, "evidenceNote", { optional: true, max: 1000 });
          const existing = await readMany(env, "academy_progress", { organization_id: ctx.organizationId, user_id: userId, skill_id: skillId }, "*", 1);
          const evidence = [...(((existing[0]?.evidence as unknown[]) ?? []) as unknown[]), ...(note ? [{ note, at: nowIso(env), by: ctx.executorUserId, stage }] : [])];
          if (stage === "certified" && evidence.length === 0) throw new ToolError("Certification requires recorded evidence.", "evidence_required");
          const patch = { stage, evidence, assessed_by: stage === "assessment" || stage === "certified" ? ctx.executorUserId : null, certified_at: stage === "certified" ? nowIso(env) : null };
          if (existing[0]) {
            await updateOne(env, "academy_progress", ctx.organizationId, String(existing[0].id), patch);
            return { id: existing[0].id, stage };
          }
          const row = await insertOne(env, "academy_progress", { organization_id: ctx.organizationId, user_id: userId, skill_id: skillId, ...patch });
          return { id: row.id, stage };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "academy_progress", ctx.organizationId, String(out.id), { stage: out.stage });
        },
      },
      env
    ),

    defineTool(
      {
        key: "comm.log_activity",
        async run(ctx, input) {
          const linkedType = oneOf(input, "linkedType", Object.keys(LINK_TABLE) as (keyof typeof LINK_TABLE)[], true);
          const linkedId = uuid(input, "linkedId", true);
          if ((linkedType === undefined) !== (linkedId === undefined)) throw new InputError("linkedType and linkedId must be given together");
          if (linkedType && linkedId) await mustRead(env, LINK_TABLE[linkedType], ctx.organizationId, linkedId, `Linked ${linkedType}`, "id");
          const row = await insertOne(env, "comm_activities", {
            organization_id: ctx.organizationId,
            channel: oneOf(input, "channel", CHANNEL)!,
            direction: oneOf(input, "direction", ["inbound", "outbound"] as const)!,
            status: oneOf(input, "status", ["logged", "delivered", "failed", "missed"] as const, true) ?? "logged",
            subject: str(input, "subject", { optional: true, max: 300 }),
            summary: str(input, "summary", { optional: true, max: 4000 }),
            occurred_at: str(input, "occurredAt", { optional: true, max: 40 }) ?? nowIso(env),
            linked_type: linkedType ?? null,
            linked_id: linkedId ?? null,
            external_ref: str(input, "externalRef", { optional: true, max: 200 }),
          });
          return { id: row.id, linkedType: linkedType ?? null, linkedId: linkedId ?? null };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "comm_activities", ctx.organizationId, String(out.id), { linked_type: out.linkedType, linked_id: out.linkedId });
        },
      },
      env
    ),
  ];
}
