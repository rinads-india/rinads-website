import {
  STUDIO_STAGES,
  assetProblems,
  canAdvanceStage,
  canPublishAsset,
  classifyBudgetChange,
  validateContentItem,
  CONTENT_CHANNELS,
  type AssetRecord,
  type ContentItem,
  type DomainTool,
  type StudioStage,
} from "@rinads/company-os-engine";
import { ToolError, afterWrite, defineTool, evt, insertOne, mustRead, nowIso, readMany, updateOne, verifyRow, type Env } from "../kit";
import { InputError, bool, compact, date, num, oneOf, reqStr, reqUuid, str, uuid, type Input } from "../validate";
import type { Row } from "../db";

const ASSET_KIND = ["image", "video", "audio", "voice", "animation", "vfx", "design", "copy", "script", "storyboard", "document"] as const;
const CREATOR = ["human", "ai", "hybrid"] as const;
const SOURCE = ["original", "client_supplied", "stock", "ai_generated", "third_party"] as const;
const ROLE = ["working", "master", "variant"] as const;
const PLATFORM = ["meta", "google", "youtube", "linkedin", "x", "other"] as const;

function toAsset(row: Row): AssetRecord {
  return {
    id: String(row.id),
    kind: row.kind as AssetRecord["kind"],
    title: String(row.title),
    version: Number(row.version),
    role: row.role as AssetRecord["role"],
    parentAssetId: (row.parent_asset_id as string | null) ?? null,
    creatorKind: row.creator_kind as AssetRecord["creatorKind"],
    creatorUserId: (row.creator_user_id as string | null) ?? null,
    aiProvider: (row.ai_provider as string | null) ?? null,
    aiModel: (row.ai_model as string | null) ?? null,
    promptRef: (row.prompt_ref as string | null) ?? null,
    sourceKind: row.source_kind as AssetRecord["sourceKind"],
    licenseTerms: (row.license_terms as string | null) ?? null,
    licenseRef: (row.license_ref as string | null) ?? null,
    companyId: (row.company_id as string | null) ?? null,
    campaignId: (row.campaign_id as string | null) ?? null,
    projectId: (row.project_id as string | null) ?? null,
    approvalStatus: row.approval_status as AssetRecord["approvalStatus"],
    channel: (row.channel as string | null) ?? null,
    storagePath: (row.storage_path as string | null) ?? null,
  };
}

export function studioTools(env: Env): DomainTool[] {
  return [
    defineTool(
      {
        key: "campaign.create",
        async run(ctx, input) {
          const companyId = uuid(input, "companyId", true);
          if (companyId) await mustRead(env, "crm_companies", ctx.organizationId, companyId, "Company", "id");
          const channels = (Array.isArray(input.channels) ? input.channels : []).map(String);
          for (const c of channels) if (!(CONTENT_CHANNELS as readonly string[]).includes(c)) throw new InputError(`Unknown channel ${c}`);
          const row = await insertOne(env, "growth_campaigns", {
            organization_id: ctx.organizationId,
            company_id: companyId,
            name: reqStr(input, "name", { max: 200 }),
            objective: str(input, "objective", { optional: true, max: 1000 }),
            channels,
            budget: num(input, "budget", { optional: true, min: 0 }),
            start_date: date(input, "startDate"),
            end_date: date(input, "endDate"),
            owner_id: uuid(input, "ownerId", true) ?? ctx.executorUserId,
          });
          return { id: row.id, name: row.name };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "growth_campaigns", ctx.organizationId, String(out.id), { name: out.name });
        },
      },
      env
    ),

    defineTool(
      {
        key: "studio.job.create",
        async run(ctx, input) {
          const companyId = uuid(input, "companyId", true);
          const campaignId = uuid(input, "campaignId", true);
          const projectId = uuid(input, "projectId", true);
          if (companyId) await mustRead(env, "crm_companies", ctx.organizationId, companyId, "Company", "id");
          if (campaignId) await mustRead(env, "growth_campaigns", ctx.organizationId, campaignId, "Campaign", "id");
          if (projectId) await mustRead(env, "projects", ctx.organizationId, projectId, "Project", "id");
          const brief = (typeof input.brief === "object" && input.brief !== null && !Array.isArray(input.brief) ? input.brief : {}) as Row;
          const row = await insertOne(env, "studio_jobs", {
            organization_id: ctx.organizationId,
            company_id: companyId,
            campaign_id: campaignId,
            project_id: projectId,
            title: reqStr(input, "title", { max: 200 }),
            brief,
            client_facing: bool(input, "clientFacing", true),
            owner_id: uuid(input, "ownerId", true) ?? ctx.executorUserId,
            due_date: date(input, "dueDate"),
          });
          return { id: row.id, title: row.title, stage: "request" };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "studio_jobs", ctx.organizationId, String(out.id), { stage: "request", status: "open" });
        },
      },
      env
    ),

    // Enforces the Studio gates (brief → QA → approval → master → variants → publish) against the job's real assets.
    defineTool(
      {
        key: "studio.job.advance",
        async run(ctx, input) {
          const id = reqUuid(input, "jobId");
          const to = oneOf(input, "toStage", STUDIO_STAGES as readonly StudioStage[])!;
          const job = await mustRead(env, "studio_jobs", ctx.organizationId, id, "Studio job");
          const current = job.stage as StudioStage;

          const flags: Row = {};
          if (input.briefComplete === true) flags.brief_complete = true;
          if (input.brief && typeof input.brief === "object" && !Array.isArray(input.brief)) flags.brief = input.brief;
          if (input.qaPassed !== undefined) {
            if (current !== "qa") throw new ToolError("QA can only be marked while the job is in QA.");
            flags.qa_passed = input.qaPassed === true;
          }
          if (input.approved !== undefined) {
            if (current !== "approval") throw new ToolError("An approval decision can only be recorded in the Approval stage.");
            flags.approved = input.approved === true;
          }

          const assets = (await readMany(env, "creative_assets", { organization_id: ctx.organizationId, studio_job_id: id }, "*", 500)).map(toAsset);
          const state = {
            stage: current,
            completed: ((job.completed_stages as string[] | null) ?? []) as StudioStage[],
            briefComplete: (flags.brief_complete ?? job.brief_complete) === true,
            qaPassed: (flags.qa_passed ?? job.qa_passed) === true,
            approved: (flags.approved ?? job.approved) === true,
            hasMasterAsset: assets.some((a) => a.role === "master" && a.approvalStatus === "approved"),
            clientFacing: job.client_facing === true,
            openProvenanceProblems: assets.filter((a) => assetProblems(a).some((p) => p.blocking)).length,
          };
          const gate = canAdvanceStage(state, to);
          if (!gate.ok) throw new ToolError(gate.reason, "gate_failed");

          const forward = STUDIO_STAGES.indexOf(to) > STUDIO_STAGES.indexOf(current);
          const completed = forward ? [...new Set([...state.completed, current])] : state.completed.filter((s) => STUDIO_STAGES.indexOf(s) < STUDIO_STAGES.indexOf(to));
          await updateOne(
            env,
            "studio_jobs",
            ctx.organizationId,
            id,
            compact({
              ...flags,
              stage: to,
              stage_entered_at: nowIso(env),
              completed_stages: completed,
              // rework invalidates downstream gates
              qa_passed: !forward && STUDIO_STAGES.indexOf(to) < STUDIO_STAGES.indexOf("qa") ? false : (flags.qa_passed as boolean | undefined),
              approved: !forward && STUDIO_STAGES.indexOf(to) < STUDIO_STAGES.indexOf("approval") ? false : (flags.approved as boolean | undefined),
              status: to === "performance" ? "done" : undefined,
            })
          );
          return { id, from: current, stage: to };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "studio_jobs", ctx.organizationId, String(out.id), { stage: out.stage });
        },
      },
      env
    ),

    defineTool(
      {
        key: "asset.register",
        async run(ctx, input) {
          const studioJobId = uuid(input, "studioJobId", true);
          const companyId = uuid(input, "companyId", true);
          const campaignId = uuid(input, "campaignId", true);
          const projectId = uuid(input, "projectId", true);
          const parentAssetId = uuid(input, "parentAssetId", true);
          let job: Row | null = null;
          if (studioJobId) job = await mustRead(env, "studio_jobs", ctx.organizationId, studioJobId, "Studio job", "id,company_id,campaign_id,project_id");
          if (parentAssetId) await mustRead(env, "creative_assets", ctx.organizationId, parentAssetId, "Parent asset", "id");
          const creatorKind = oneOf(input, "creatorKind", CREATOR)!;
          const role = oneOf(input, "role", ROLE, true) ?? "working";
          const draft: AssetRecord = {
            id: "pending",
            kind: oneOf(input, "kind", ASSET_KIND)!,
            title: reqStr(input, "title", { max: 300 }),
            version: num(input, "version", { optional: true, min: 1, int: true }) ?? 1,
            role,
            parentAssetId: parentAssetId ?? null,
            creatorKind,
            creatorUserId: creatorKind === "ai" ? (uuid(input, "creatorUserId", true) ?? null) : (uuid(input, "creatorUserId", true) ?? ctx.executorUserId),
            aiProvider: str(input, "aiProvider", { optional: true, max: 60 }) ?? null,
            aiModel: str(input, "aiModel", { optional: true, max: 120 }) ?? null,
            promptRef: str(input, "promptRef", { optional: true, max: 300 }) ?? null,
            sourceKind: oneOf(input, "sourceKind", SOURCE, true) ?? (creatorKind === "ai" ? "ai_generated" : "original"),
            licenseTerms: str(input, "licenseTerms", { optional: true, max: 1000 }) ?? null,
            licenseRef: str(input, "licenseRef", { optional: true, max: 300 }) ?? null,
            companyId: companyId ?? (job?.company_id as string | null) ?? null,
            campaignId: campaignId ?? (job?.campaign_id as string | null) ?? null,
            projectId: projectId ?? (job?.project_id as string | null) ?? null,
            approvalStatus: "draft",
            channel: str(input, "channel", { optional: true, max: 40 }) ?? null,
            storagePath: str(input, "storagePath", { optional: true, max: 500 }) ?? null,
          };
          const blocking = assetProblems(draft).filter((p) => p.blocking);
          if (blocking.length) throw new ToolError(blocking.map((p) => p.message).join(" "), "provenance_incomplete");
          const row = await insertOne(env, "creative_assets", {
            organization_id: ctx.organizationId,
            studio_job_id: studioJobId,
            company_id: draft.companyId,
            campaign_id: draft.campaignId,
            project_id: draft.projectId,
            parent_asset_id: draft.parentAssetId,
            kind: draft.kind,
            title: draft.title,
            version: draft.version,
            role: draft.role,
            creator_kind: draft.creatorKind,
            creator_user_id: draft.creatorUserId,
            ai_provider: draft.aiProvider,
            ai_model: draft.aiModel,
            prompt_ref: draft.promptRef,
            source_kind: draft.sourceKind,
            license_terms: draft.licenseTerms,
            license_ref: draft.licenseRef,
            channel: draft.channel,
            storage_path: draft.storagePath,
            checksum: str(input, "checksum", { optional: true, max: 128 }),
          });
          return { id: row.id, title: row.title, role };
        },
        async verify(ctx, _i, out) {
          const row = await verifyRow(env, "creative_assets", ctx.organizationId, String(out.id), { approval_status: "draft", role: out.role });
          if (assetProblems(toAsset(row)).some((p) => p.blocking)) throw new ToolError("Stored asset has blocking provenance problems.", "verification_error");
        },
      },
      env
    ),

    defineTool(
      {
        key: "asset.review",
        async run(ctx, input) {
          const id = reqUuid(input, "assetId");
          const decision = oneOf(input, "decision", ["submit", "approve", "reject"] as const)!;
          const row = await mustRead(env, "creative_assets", ctx.organizationId, id, "Asset");
          const asset = toAsset(row);
          if (decision === "submit") {
            if (asset.approvalStatus !== "draft" && asset.approvalStatus !== "rejected") throw new ToolError(`Asset is already ${asset.approvalStatus}.`, "invalid_state");
            await updateOne(env, "creative_assets", ctx.organizationId, id, { approval_status: "submitted" });
            return { id, approvalStatus: "submitted" };
          }
          if (asset.approvalStatus !== "submitted") throw new ToolError("Only a submitted asset can be approved or rejected.", "invalid_state");
          if (decision === "approve") {
            const blocking = assetProblems(asset).filter((p) => p.blocking);
            if (blocking.length) throw new ToolError(`Cannot approve: ${blocking.map((p) => p.message).join(" ")}`, "provenance_incomplete");
            await updateOne(env, "creative_assets", ctx.organizationId, id, { approval_status: "approved", approved_by: ctx.executorUserId, approved_at: nowIso(env) });
            return { id, approvalStatus: "approved" };
          }
          await updateOne(env, "creative_assets", ctx.organizationId, id, { approval_status: "rejected" });
          return { id, approvalStatus: "rejected" };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "creative_assets", ctx.organizationId, String(out.id), { approval_status: out.approvalStatus });
        },
        events: (ctx, _i, out) =>
          out.approvalStatus === "submitted"
            ? [evt(ctx, "creative.submitted.v1", "creative_asset", String(out.id))]
            : out.approvalStatus === "approved"
              ? [evt(ctx, "creative.approved.v1", "creative_asset", String(out.id))]
              : [],
      },
      env
    ),

    defineTool(
      {
        key: "content.create",
        async run(ctx, input) {
          const campaignId = uuid(input, "campaignId", true);
          const assetId = uuid(input, "assetId", true);
          const sourceIdeaId = uuid(input, "sourceIdeaId", true);
          if (campaignId) await mustRead(env, "growth_campaigns", ctx.organizationId, campaignId, "Campaign", "id");
          if (assetId) await mustRead(env, "creative_assets", ctx.organizationId, assetId, "Asset", "id");
          const id = globalThis.crypto.randomUUID();
          const channel = oneOf(input, "channel", CONTENT_CHANNELS)!;
          if (sourceIdeaId) {
            const root = await mustRead(env, "content_items", ctx.organizationId, sourceIdeaId, "Source idea", "id,source_idea_id,campaign_id");
            if (campaignId && root.campaign_id && root.campaign_id !== campaignId) throw new ToolError("A variant must belong to the same campaign as its source idea.");
          }
          const item: ContentItem = { id, campaignId: campaignId ?? null, sourceIdeaId: sourceIdeaId ?? id, channel, status: "idea", title: reqStr(input, "title", { max: 300 }), assetId: assetId ?? null, scheduledAt: null, publishedAt: null, externalUrl: null };
          const problems = validateContentItem(item);
          if (problems.length) throw new ToolError(problems.map((p) => p.message).join(" "));
          await insertOne(env, "content_items", {
            id,
            organization_id: ctx.organizationId,
            campaign_id: item.campaignId,
            source_idea_id: item.sourceIdeaId,
            asset_id: item.assetId,
            channel,
            status: "idea",
            title: item.title,
            body_ref: str(input, "bodyRef", { optional: true, max: 500 }),
          });
          return { id, sourceIdeaId: item.sourceIdeaId, channel };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "content_items", ctx.organizationId, String(out.id), { source_idea_id: out.sourceIdeaId, channel: out.channel });
        },
      },
      env
    ),

    defineTool(
      {
        key: "content.update",
        async run(ctx, input) {
          const id = reqUuid(input, "contentId");
          const to = oneOf(input, "status", ["idea", "drafting", "in_review", "approved", "scheduled", "archived"] as const)!;
          const row = await mustRead(env, "content_items", ctx.organizationId, id, "Content item");
          if (row.status === "published") throw new ToolError("Published content cannot be changed here.", "invalid_state");
          const item: ContentItem = {
            id,
            campaignId: (row.campaign_id as string | null) ?? null,
            sourceIdeaId: String(row.source_idea_id),
            channel: row.channel as ContentItem["channel"],
            status: to,
            title: String(row.title),
            assetId: uuid(input, "assetId", true) ?? ((row.asset_id as string | null) ?? null),
            scheduledAt: date(input, "scheduledAt") ?? ((row.scheduled_at as string | null) ?? null),
            publishedAt: null,
            externalUrl: null,
          };
          const problems = validateContentItem(item);
          if (problems.length) throw new ToolError(problems.map((p) => p.message).join(" "));
          if (item.assetId && item.assetId !== row.asset_id) await mustRead(env, "creative_assets", ctx.organizationId, item.assetId, "Asset", "id");
          await updateOne(env, "content_items", ctx.organizationId, id, compact({ status: to, asset_id: item.assetId, scheduled_at: item.scheduledAt }));
          return { id, status: to };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "content_items", ctx.organizationId, String(out.id), { status: out.status });
        },
      },
      env
    ),

    // HIGH — publishing consequential content needs an approved ledger row; assets must be approved with clean provenance.
    defineTool(
      {
        key: "content.publish",
        async run(ctx, input) {
          const id = reqUuid(input, "contentId");
          const content = await mustRead(env, "content_items", ctx.organizationId, id, "Content item");
          if (content.status === "published") throw new ToolError("Already published.", "invalid_state");
          if (content.status !== "approved" && content.status !== "scheduled") throw new ToolError("Only approved or scheduled content can be published.", "invalid_state");
          const channel = String(content.channel);
          const assetId: string | null = (content.asset_id as string | null) ?? null;
          if (channel !== "paid_ads") {
            if (!assetId) throw new ToolError("Content needs an approved asset before publishing.");
            const asset = toAsset(await mustRead(env, "creative_assets", ctx.organizationId, assetId, "Asset"));
            const gate = canPublishAsset(asset);
            if (!gate.ok) throw new ToolError(gate.reason, "gate_failed");
          }
          const at = nowIso(env);
          const externalUrl = str(input, "externalUrl", { optional: true, max: 500 });
          let publicationId: string | null = null;
          if (assetId) {
            const pub = await insertOne(env, "asset_publications", {
              organization_id: ctx.organizationId,
              asset_id: assetId,
              content_item_id: id,
              channel,
              status: "published",
              published_at: at,
              external_url: externalUrl,
              approved_action_id: ctx.actionId,
            });
            publicationId = String(pub.id);
          }
          await afterWrite(
            () => updateOne(env, "content_items", ctx.organizationId, id, compact({ status: "published", published_at: at, external_url: externalUrl, publish_action_id: ctx.actionId })),
            "Marking the content published"
          );
          return { id, status: "published", publicationId, publishActionId: ctx.actionId };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "content_items", ctx.organizationId, String(out.id), { status: "published", publish_action_id: out.publishActionId });
          if (out.publicationId) await verifyRow(env, "asset_publications", ctx.organizationId, String(out.publicationId), { status: "published" });
        },
        events: (ctx, _i, out) => [evt(ctx, "content.published.v1", "content_item", String(out.id))],
      },
      env
    ),

    defineTool(
      {
        key: "ad.create",
        async run(ctx, input) {
          const campaignId = uuid(input, "campaignId", true);
          if (campaignId) await mustRead(env, "growth_campaigns", ctx.organizationId, campaignId, "Campaign", "id");
          const row = await insertOne(env, "ad_campaigns", {
            organization_id: ctx.organizationId,
            campaign_id: campaignId,
            platform: oneOf(input, "platform", PLATFORM)!,
            external_id: str(input, "externalId", { optional: true, max: 120 }),
            name: reqStr(input, "name", { max: 200 }),
            objective: str(input, "objective", { optional: true, max: 500 }),
            landing_page: str(input, "landingPage", { optional: true, max: 500 }),
            status: "draft",
          });
          return { id: row.id, name: row.name };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "ad_campaigns", ctx.organizationId, String(out.id), { status: "draft" });
        },
      },
      env
    ),

    defineTool(
      {
        key: "ads.import_metrics",
        async run(ctx, input) {
          const adCampaignId = reqUuid(input, "adCampaignId");
          await mustRead(env, "ad_campaigns", ctx.organizationId, adCampaignId, "Ad campaign", "id");
          const rows = input.rows;
          if (!Array.isArray(rows) || rows.length === 0 || rows.length > 500) throw new InputError("rows must contain 1–500 daily metric rows");
          let inserted = 0;
          let skipped = 0;
          for (const r of rows as Input[]) {
            const record = {
              organization_id: ctx.organizationId,
              ad_campaign_id: adCampaignId,
              ad_id: reqStr(r, "adId", { max: 120 }),
              ad_name: reqStr(r, "adName", { max: 200 }),
              metric_date: date(r, "date", false),
              spend: num(r, "spend", { min: 0 }),
              impressions: num(r, "impressions", { min: 0, int: true }),
              clicks: num(r, "clicks", { min: 0, int: true }),
              conversions: num(r, "conversions", { min: 0, int: true }),
              frequency: num(r, "frequency", { optional: true, min: 0 }),
              hook: str(r, "hook", { optional: true, max: 200 }),
              audience: str(r, "audience", { optional: true, max: 200 }),
              landing_page: str(r, "landingPage", { optional: true, max: 500 }),
              source: "csv_import",
            };
            const { error } = await env.db.insert("ad_metrics_daily", record);
            if (error && (error.code === "23505" || /duplicate|unique/i.test(error.message))) skipped += 1;
            else if (error) throw inserted > 0 ? new ToolError(`Imported ${inserted} rows before failing: ${error.message}`, "partial_import") : new ToolError(error.message, "write_rejected");
            else inserted += 1;
          }
          return { adCampaignId, inserted, skipped };
        },
        async verify(ctx, _i, out) {
          const rows = await readMany(env, "ad_metrics_daily", { organization_id: ctx.organizationId, ad_campaign_id: String(out.adCampaignId) }, "id", 5000);
          if (rows.length < Number(out.inserted)) throw new ToolError("Imported metric rows are missing after write.", "verification_error");
        },
      },
      env
    ),

    // HIGH/CRITICAL — budget changes always need an approved ledger row; the DB also refuses reuse of an approval.
    defineTool(
      {
        key: "ads.budget_change",
        async run(ctx, input) {
          const id = reqUuid(input, "adCampaignId");
          const proposed = num(input, "proposedBudget", { min: 0 })!;
          const ad = await mustRead(env, "ad_campaigns", ctx.organizationId, id, "Ad campaign");
          const current = ad.daily_budget === null || ad.daily_budget === undefined ? 0 : Number(ad.daily_budget);
          const risk = classifyBudgetChange(current, proposed);
          await updateOne(env, "ad_campaigns", ctx.organizationId, id, { daily_budget: proposed, budget_action_id: ctx.actionId });
          return { id, previousBudget: current, daily_budget: proposed, risk: risk.risk, budgetActionId: ctx.actionId };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "ad_campaigns", ctx.organizationId, String(out.id), { daily_budget: out.daily_budget, budget_action_id: out.budgetActionId });
        },
      },
      env
    ),
  ];
}
