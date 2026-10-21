import { DELIVERABLE_MACHINE, MILESTONE_MACHINE, TASK_MACHINE, canTransition, type DomainTool } from "@rinads/company-os-engine";
import {
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
  workerIdForUser,
  type Env,
} from "../kit";
import { bool, compact, date, num, oneOf, reqStr, reqUuid, str, strArray, uuid, uuidArray } from "../validate";

const PRIORITY = ["low", "normal", "high", "urgent"] as const;
const TASK_STATUS = ["todo", "in_progress", "blocked", "completed", "cancelled"] as const;
const PROJECT_KIND = ["project", "retainer"] as const;
const PROJECT_STATUS = ["planned", "active", "on_hold", "completed", "cancelled"] as const;
const MILESTONE_STATUS = ["pending", "in_progress", "done"] as const;

export function deliveryTools(env: Env): DomainTool[] {
  return [
    defineTool(
      {
        key: "project.create",
        async run(ctx, input) {
          const companyId = uuid(input, "companyId", true);
          const contractId = uuid(input, "contractId", true);
          if (companyId) await mustRead(env, "crm_companies", ctx.organizationId, companyId, "Company", "id");
          if (contractId) {
            const c = await mustRead(env, "crm_contracts", ctx.organizationId, contractId, "Contract", "id,status,company_id");
            if (c.status !== "signed") throw new ToolError("A project can only be linked to a signed contract.", "invalid_state");
          }
          const row = await insertOne(env, "projects", {
            organization_id: ctx.organizationId,
            company_id: companyId,
            contract_id: contractId,
            name: reqStr(input, "name", { max: 200 }),
            kind: oneOf(input, "kind", PROJECT_KIND, true) ?? "project",
            status: oneOf(input, "status", PROJECT_STATUS, true) ?? "planned",
            description: str(input, "description", { optional: true, max: 4000 }),
            start_date: date(input, "startDate"),
            due_date: date(input, "dueDate"),
            owner_id: uuid(input, "ownerId", true) ?? (await workerIdForUser(env, ctx.organizationId, ctx.executorUserId)),
            budget: num(input, "budget", { optional: true, min: 0 }),
          });
          return { id: row.id, name: row.name, status: row.status };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "projects", ctx.organizationId, String(out.id), { name: out.name });
        },
        events: (ctx, _i, out) => [evt(ctx, "project.created.v1", "project", String(out.id))],
      },
      env
    ),

    defineTool(
      {
        key: "milestone.update",
        async run(ctx, input) {
          const projectId = reqUuid(input, "projectId");
          await mustRead(env, "projects", ctx.organizationId, projectId, "Project", "id");
          const milestoneId = uuid(input, "milestoneId", true);
          const status = oneOf(input, "status", MILESTONE_STATUS, true);
          if (!milestoneId) {
            const row = await insertOne(env, "project_milestones", {
              organization_id: ctx.organizationId,
              project_id: projectId,
              name: reqStr(input, "name", { max: 200 }),
              due_date: date(input, "dueDate"),
              sort_order: num(input, "sortOrder", { optional: true, int: true }) ?? 0,
              status: status ?? "pending",
            });
            return { id: row.id, status: row.status, created: true };
          }
          const m = await mustRead(env, "project_milestones", ctx.organizationId, milestoneId, "Milestone");
          if (m.project_id !== projectId) throw new ToolError("Milestone does not belong to this project.");
          if (status && status !== m.status) {
            const t = canTransition(MILESTONE_MACHINE, m.status as never, status);
            if (!t.ok) throw new ToolError(t.reason, "invalid_transition");
          }
          await updateOne(
            env,
            "project_milestones",
            ctx.organizationId,
            milestoneId,
            compact({
              name: str(input, "name", { optional: true, max: 200 }),
              due_date: date(input, "dueDate"),
              status,
              completed_at: status === "done" ? nowIso(env) : undefined,
            })
          );
          return { id: milestoneId, status: status ?? m.status, created: false };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "project_milestones", ctx.organizationId, String(out.id), { status: out.status });
        },
      },
      env
    ),

    defineTool(
      {
        key: "task.create",
        async run(ctx, input) {
          const projectId = uuid(input, "projectId", true);
          const milestoneId = uuid(input, "milestoneId", true);
          if (projectId) await mustRead(env, "projects", ctx.organizationId, projectId, "Project", "id");
          if (milestoneId) await mustRead(env, "project_milestones", ctx.organizationId, milestoneId, "Milestone", "id");
          const blockedBy = uuidArray(input, "blockedBy");
          if (blockedBy.length) {
            const found = await readMany(env, "operational_tasks", { organization_id: ctx.organizationId, id: { in: blockedBy } }, "id", blockedBy.length);
            if (found.length !== blockedBy.length) throw new ToolError("blockedBy references a task outside this organisation.");
          }
          const row = await insertOne(env, "operational_tasks", {
            organization_id: ctx.organizationId,
            title: reqStr(input, "title", { max: 300 }),
            description: str(input, "description", { optional: true, max: 4000 }),
            assignee_id: uuid(input, "assigneeId", true),
            priority: oneOf(input, "priority", PRIORITY, true) ?? "normal",
            status: "todo",
            due_at: date(input, "dueAt"),
            project_id: projectId,
            milestone_id: milestoneId,
            estimate_hours: num(input, "estimateHours", { optional: true, min: 0, max: 10000 }),
            required_skills: strArray(input, "requiredSkills", { max: 20 }),
            blocked_by: blockedBy,
            created_by: ctx.executorUserId,
          });
          return { id: row.id, title: row.title };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "operational_tasks", ctx.organizationId, String(out.id), { status: "todo", title: out.title });
        },
        events: (ctx, _i, out) => [evt(ctx, "task.created.v1", "operational_task", String(out.id))],
      },
      env
    ),

    defineTool(
      {
        key: "task.update_status",
        async run(ctx, input) {
          const id = reqUuid(input, "taskId");
          const to = oneOf(input, "status", TASK_STATUS)!;
          const task = await mustRead(env, "operational_tasks", ctx.organizationId, id, "Task");
          const t = canTransition(TASK_MACHINE, task.status as never, to);
          if (!t.ok) throw new ToolError(t.reason, "invalid_transition");
          const deps = (task.blocked_by as string[] | null) ?? [];
          if (deps.length && (to === "in_progress" || to === "completed")) {
            const blockers = await readMany(env, "operational_tasks", { organization_id: ctx.organizationId, id: { in: deps } }, "id,title,status", deps.length);
            const open = blockers.filter((b) => b.status !== "completed" && b.status !== "cancelled");
            if (open.length) throw new ToolError(`Blocked by ${open.length} unfinished task(s): ${open.map((b) => b.title).join(", ")}`, "dependency_open");
          }
          await updateOne(env, "operational_tasks", ctx.organizationId, id, compact({ status: to, completed_at: to === "completed" ? nowIso(env) : undefined }));
          return { id, from: task.status, status: to };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "operational_tasks", ctx.organizationId, String(out.id), { status: out.status });
        },
        events: (ctx, _i, out) => (out.status === "completed" ? [evt(ctx, "task.completed.v1", "operational_task", String(out.id))] : []),
      },
      env
    ),

    // Manager decision. Records what was recommended, what was chosen and (when different) why.
    defineTool(
      {
        key: "task.assign",
        async run(ctx, input) {
          const id = reqUuid(input, "taskId");
          const assigneeId = reqUuid(input, "assigneeId");
          const followed = bool(input, "followedRecommendation", false);
          const reason = str(input, "overrideReason", { optional: true, max: 1000 });
          if (!followed && !reason) throw new ToolError("A rationale is required when overriding the recommendation (or when no recommendation was used).");
          const task = await mustRead(env, "operational_tasks", ctx.organizationId, id, "Task");
          if (task.status === "completed" || task.status === "cancelled") throw new ToolError("A finished task cannot be reassigned.", "invalid_state");
          const worker = await readMany(env, "people_profiles", { organization_id: ctx.organizationId, id: assigneeId, status: "active" }, "id", 1);
          if (!worker[0]) throw new ToolError("The assignee is not an active team member of this organisation.");
          const decision = await insertOne(env, "work_assignment_decisions", {
            organization_id: ctx.organizationId,
            task_id: id,
            recommended_worker_id: uuid(input, "recommendedWorkerId", true),
            chosen_worker_id: assigneeId,
            followed_recommendation: followed,
            override_reason: followed ? null : reason,
            confidence: oneOf(input, "confidence", ["high", "medium", "low"] as const, true),
            factor_snapshot: input.factorSnapshot ?? null,
          });
          await afterWrite(() => updateOne(env, "operational_tasks", ctx.organizationId, id, { assignee_id: assigneeId }), "Assigning the task");
          return { id, assigneeId, decisionId: decision.id, previousAssigneeId: task.assignee_id ?? null };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "operational_tasks", ctx.organizationId, String(out.id), { assignee_id: out.assigneeId });
          await verifyRow(env, "work_assignment_decisions", ctx.organizationId, String(out.decisionId), { chosen_worker_id: out.assigneeId });
        },
        events: (ctx, _i, out) => [evt(ctx, "task.assigned.v1", "operational_task", String(out.id), { assigneeId: out.assigneeId, previousAssigneeId: out.previousAssigneeId })],
      },
      env
    ),

    defineTool(
      {
        key: "deliverable.create",
        async run(ctx, input) {
          const projectId = uuid(input, "projectId", true);
          const milestoneId = uuid(input, "milestoneId", true);
          const taskId = uuid(input, "taskId", true);
          let companyId = uuid(input, "companyId", true);
          if (projectId) {
            const p = await mustRead(env, "projects", ctx.organizationId, projectId, "Project", "id,company_id");
            companyId = companyId ?? (p.company_id as string | null) ?? undefined;
          }
          if (milestoneId) await mustRead(env, "project_milestones", ctx.organizationId, milestoneId, "Milestone", "id");
          if (taskId) await mustRead(env, "operational_tasks", ctx.organizationId, taskId, "Task", "id");
          const row = await insertOne(env, "deliverables", {
            organization_id: ctx.organizationId,
            project_id: projectId,
            milestone_id: milestoneId,
            task_id: taskId,
            company_id: companyId,
            title: reqStr(input, "title", { max: 300 }),
            due_date: date(input, "dueDate"),
            notes: str(input, "notes", { optional: true, max: 4000 }),
          });
          return { id: row.id, title: row.title };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "deliverables", ctx.organizationId, String(out.id), { status: "draft" });
        },
      },
      env
    ),

    defineTool(
      {
        key: "deliverable.submit",
        async run(ctx, input) {
          const id = reqUuid(input, "deliverableId");
          const d = await mustRead(env, "deliverables", ctx.organizationId, id, "Deliverable");
          const t = canTransition(DELIVERABLE_MACHINE, d.status as never, "submitted");
          if (!t.ok) throw new ToolError(t.reason, "invalid_transition");
          await updateOne(env, "deliverables", ctx.organizationId, id, { status: "submitted", submitted_at: nowIso(env) });
          return { id, status: "submitted" };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "deliverables", ctx.organizationId, String(out.id), { status: "submitted" });
        },
        events: (ctx, _i, out) => [evt(ctx, "deliverable.submitted.v1", "deliverable", String(out.id))],
      },
      env
    ),

    defineTool(
      {
        key: "deliverable.review",
        async run(ctx, input) {
          const id = reqUuid(input, "deliverableId");
          const decision = oneOf(input, "decision", ["in_review", "approve", "request_changes"] as const)!;
          const d = await mustRead(env, "deliverables", ctx.organizationId, id, "Deliverable");
          const to = decision === "approve" ? "approved" : decision === "request_changes" ? "changes_requested" : "in_review";
          const t = canTransition(DELIVERABLE_MACHINE, d.status as never, to);
          if (!t.ok) throw new ToolError(t.reason, "invalid_transition");
          if (decision === "request_changes" && !str(input, "note", { optional: true })) throw new ToolError("Say what needs to change.");
          await updateOne(
            env,
            "deliverables",
            ctx.organizationId,
            id,
            compact({
              status: to,
              approved_at: decision === "approve" ? nowIso(env) : undefined,
              approved_by: decision === "approve" ? ctx.executorUserId : undefined,
              change_requests: decision === "request_changes" ? Number(d.change_requests ?? 0) + 1 : undefined,
              notes: decision === "request_changes" ? str(input, "note", { max: 4000 }) : undefined,
            })
          );
          return { id, status: to };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "deliverables", ctx.organizationId, String(out.id), { status: out.status });
        },
        events: (ctx, _i, out) => (out.status === "approved" ? [evt(ctx, "deliverable.approved.v1", "deliverable", String(out.id))] : []),
      },
      env
    ),
  ];
}
