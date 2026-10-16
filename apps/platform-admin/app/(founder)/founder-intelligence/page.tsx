import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { loadFounderIntelligenceSnapshot } from "@/lib/founder-intelligence/adapters";
import { loadRinpoControlSnapshot } from "@/lib/rinpo-control/adapters";
import type {
  ConnectionState,
  FounderWorkspace,
  SourceCheck,
} from "@/lib/founder-intelligence/types";

export const dynamic = "force-dynamic";

const controls = [
  { label: "Public website", href: "https://www.rinads.com", icon: "⌂" },
  {
    label: "Platform admin",
    href: process.env.NEXT_PUBLIC_PLATFORM_ADMIN_URL ?? "https://admin.rinads.com",
    icon: "⌘",
  },
  {
    label: "Owner portal",
    href: process.env.NEXT_PUBLIC_OWNER_PORTAL_URL ?? "https://app.rinads.com",
    icon: "◇",
  },
  {
    label: "Customer portal",
    href: process.env.NEXT_PUBLIC_CUSTOMER_PORTAL_URL ?? "https://customers.rinads.com",
    icon: "◎",
  },
  {
    label: "R GLOW",
    href: process.env.NEXT_PUBLIC_RINAGLOW_URL ?? "https://glow.rinads.com",
    icon: "✦",
  },
];

const stateLabels: Record<ConnectionState, string> = {
  operational: "Operational",
  degraded: "Degraded",
  unavailable: "Unavailable",
  not_connected: "Not connected",
};

type FounderAttentionItem = {
  id: string;
  label: string;
  detail: string;
  state: Exclude<ConnectionState, "operational">;
  href?: string;
};

function StatusDot({ state }: { state: ConnectionState }) {
  return <span className={`fi-status-dot fi-status-${state}`} aria-hidden="true" />;
}

function SourceCard({ source }: { source: SourceCheck }) {
  const content = (
    <>
      <div className="fi-card-heading">
        <div>
          <span className="fi-eyebrow">Live source</span>
          <h2>{source.label}</h2>
        </div>
        <span className={`fi-status-pill fi-status-${source.state}`}>
          <StatusDot state={source.state} />
          {stateLabels[source.state]}
        </span>
      </div>
      <p className="fi-card-detail">{source.detail}</p>
      {source.items?.length ? (
        <div className="fi-system-list" aria-label={`${source.label} detail`}>
          {source.items.map((item) => (
            <div key={item.id}>
              <span>{item.label}</span>
              <strong>
                <StatusDot state={item.state} />
                {stateLabels[item.state]}
              </strong>
            </div>
          ))}
        </div>
      ) : null}
      <span className="fi-checked">
        {source.checkedAt
          ? `Checked ${new Date(source.checkedAt).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              timeZoneName: "short",
            })}`
          : "Awaiting configuration"}
      </span>
    </>
  );

  return source.href ? (
    <a className="fi-glass-card fi-source-card" href={source.href} target="_blank" rel="noreferrer">
      {content}
    </a>
  ) : (
    <article className="fi-glass-card fi-source-card">{content}</article>
  );
}

function WorkspaceCard({ workspace }: { workspace: FounderWorkspace }) {
  return (
    <Link className="fi-glass-card fi-workspace-card" href={`/tenants/${workspace.organizationId}`}>
      <div className="fi-card-heading">
        <div>
          <span className="fi-eyebrow">{workspace.organizationName}</span>
          <h2>{workspace.name}</h2>
        </div>
        <span className={`fi-workspace-state ${workspace.status === "active" ? "is-active" : ""}`}>
          {workspace.status}
        </span>
      </div>
      <p className="fi-card-detail">
        {workspace.kind.replaceAll("_", " ")}
        {workspace.isDefault ? " · default workspace" : ""}
      </p>
      <div className="fi-member-row">
        <span className="fi-avatar fi-avatar-purple">R</span>
        <span>{workspace.locationCount} connected location{workspace.locationCount === 1 ? "" : "s"}</span>
        <span className="fi-arrow">↗</span>
      </div>
    </Link>
  );
}

function ArchitectureMap({ sources }: { sources: SourceCheck[] }) {
  const source = (id: string) => sources.find((item) => item.id === id)?.state ?? "not_connected";
  return (
    <section className="fi-glass-card fi-architecture" aria-labelledby="architecture-title">
      <div>
        <span className="fi-eyebrow">End-to-end control map</span>
        <h2 id="architecture-title">RINADS platform flow</h2>
      </div>
      <div className="fi-flow">
        <div className="fi-flow-node">
          <span>Experience</span>
          <strong>Next.js apps</strong>
          <small>Stateless, independently scaled</small>
          <StatusDot state={source("vercel")} />
        </div>
        <span className="fi-flow-arrow">→</span>
        <div className="fi-flow-node">
          <span>Platform kernel</span>
          <strong>Supabase + RLS</strong>
          <small>Organizations, workspaces, data</small>
          <StatusDot state={source("supabase")} />
        </div>
        <span className="fi-flow-arrow">→</span>
        <div className="fi-flow-node">
          <span>Execution</span>
          <strong>RINPO runtime</strong>
          <small>Permissioned tools and workers</small>
          <StatusDot state={source("rinpo-runtime")} />
        </div>
      </div>
      <Link className="fi-text-link" href="/founder-intelligence#controls">
        Open controls <span>↗</span>
      </Link>
    </section>
  );
}

export default async function FounderIntelligencePage() {
  const [snapshot, rinpo] = await Promise.all([
    loadFounderIntelligenceSnapshot(),
    loadRinpoControlSnapshot(),
  ]);
  const workspaces =
    snapshot.workspaceResult.state === "operational"
      ? snapshot.workspaceResult.workspaces
      : [];
  const allConnected =
    snapshot.sources.every((source) => source.state === "operational") &&
    snapshot.workspaceResult.state === "operational" &&
    snapshot.workResult.state === "operational";
  const connectedCount = snapshot.sources.filter(
    (source) => source.state !== "not_connected"
  ).length;

  const pendingApprovals = rinpo.metrics.find((metric) => metric.id === "pending_approvals");
  const pendingActions = rinpo.metrics.find((metric) => metric.id === "pending_actions");
  const selectedProvider = rinpo.providerRoutes.find((provider) => provider.selectedByDefault);
  const vercel = snapshot.sources.find((source) => source.id === "vercel");
  const websiteDeployment = vercel?.items?.find((item) => item.label === "www.rinads.com");
  const adminDeployment = vercel?.items?.find((item) => item.label === "Platform admin");
  const websiteSha = websiteDeployment?.metadata?.commitSha;
  const adminSha = adminDeployment?.metadata?.commitSha;
  const work = snapshot.workResult;

  const attention: FounderAttentionItem[] = [];

  for (const source of snapshot.sources) {
    if (source.id === "vercel" && source.items?.length) {
      for (const item of source.items) {
        if (item.state !== "operational") {
          attention.push({
            id: `vercel-${item.id}`,
            label: `${item.label} deployment`,
            detail: item.detail,
            state: item.state,
            href: item.href,
          });
        }
      }
      continue;
    }
    if (source.state !== "operational") {
      attention.push({
        id: `source-${source.id}`,
        label: source.label,
        detail: source.detail,
        state: source.state,
        href: source.href,
      });
    }
  }

  if (snapshot.workspaceResult.state !== "operational") {
    attention.push({
      id: "workspace-registry",
      label: "Workspace registry",
      detail: snapshot.workspaceResult.detail,
      state: snapshot.workspaceResult.state,
    });
  }

  if (work.state !== "operational") {
    attention.push({
      id: "work-intelligence",
      label: "Operational work intelligence",
      detail: work.detail,
      state: work.state,
    });
  } else {
    if (work.counts.overdue > 0) {
      attention.push({
        id: "overdue-work",
        label: "Overdue work",
        detail: `${work.counts.overdue} open task${work.counts.overdue === 1 ? " is" : "s are"} past due.`,
        state: "degraded",
      });
    }
    if (work.counts.blocked > 0) {
      attention.push({
        id: "blocked-work",
        label: "Blocked work",
        detail: `${work.counts.blocked} task${work.counts.blocked === 1 ? " is" : "s are"} blocked.`,
        state: "degraded",
      });
    }
    if (work.counts.urgent > 0) {
      attention.push({
        id: "urgent-work",
        label: "Urgent work",
        detail: `${work.counts.urgent} open task${work.counts.urgent === 1 ? " is" : "s are"} marked urgent.`,
        state: "degraded",
      });
    }
    if (work.counts.unacknowledgedAlerts > 0) {
      attention.push({
        id: "operational-alerts",
        label: "Operational alerts",
        detail: `${work.counts.unacknowledgedAlerts} alert${work.counts.unacknowledgedAlerts === 1 ? " requires" : "s require"} acknowledgement.`,
        state: "degraded",
      });
    }
  }

  if ((pendingApprovals?.value ?? 0) > 0) {
    attention.push({
      id: "pending-approvals",
      label: "RINPO approvals waiting",
      detail: `${pendingApprovals?.value} runtime approval${pendingApprovals?.value === 1 ? "" : "s"} require a human decision.`,
      state: "degraded",
      href: "/rinpo",
    });
  }

  if ((pendingActions?.value ?? 0) > 0) {
    attention.push({
      id: "pending-actions",
      label: "RINPO actions pending",
      detail: `${pendingActions?.value} governed RINPO action${pendingActions?.value === 1 ? "" : "s"} remain pending.`,
      state: "degraded",
      href: "/rinpo",
    });
  }

  if (selectedProvider && !selectedProvider.configured) {
    attention.push({
      id: "rinpo-provider",
      label: "Selected RINPO provider is not configured",
      detail: `${selectedProvider.provider} / ${selectedProvider.model} is selected by default but has no complete server-side provider configuration.`,
      state: "not_connected",
      href: "/rinpo",
    });
  }

  if (
    typeof websiteSha === "string" &&
    typeof adminSha === "string" &&
    websiteSha &&
    adminSha &&
    websiteSha !== adminSha
  ) {
    attention.push({
      id: "deployment-parity",
      label: "Deployment parity mismatch",
      detail: `www.rinads.com is on ${websiteSha.slice(0, 7)} while admin.rinads.com is on ${adminSha.slice(0, 7)}. Review whether the control plane should be promoted from the same canonical monorepo state.`,
      state: "degraded",
      href: "https://vercel.com/dashboard",
    });
  }

  return (
    <div className="fi-scene">
      <div className="fi-sky" aria-hidden="true" />
      <div className="fi-hills fi-hills-back" aria-hidden="true" />
      <div className="fi-hills fi-hills-front" aria-hidden="true" />
      <header className="fi-topbar">
        <Link href="/founder-intelligence" className="fi-brand" aria-label="Founder Intelligence home">
          <span className="fi-brand-mark">R</span>
          <span>
            <strong>Rinads</strong>
            <small>Business simplified</small>
          </span>
        </Link>
        <div className="fi-top-actions">
          <Link className="fi-top-chip" href="/">
            Admin
          </Link>
          <div className="fi-view-switch" aria-label="Current view">
            <span>Dashboard</span>
            <strong>Control centre</strong>
          </div>
          <SignOutButton />
        </div>
      </header>

      <section className="fi-intro">
        <div>
          <span className="fi-kicker">RINPO BUSINESS OS</span>
          <h1>Founder Intelligence</h1>
          <p>One truthful view of RINADS priorities, approvals, deployments, workspaces, and runtime.</p>
        </div>
        <div className={`fi-overall ${allConnected ? "is-operational" : ""}`}>
          <StatusDot state={allConnected ? "operational" : "not_connected"} />
          <span>
            <strong>{allConnected ? "All sources operational" : "Connection setup incomplete"}</strong>
            <small>
              {connectedCount}/{snapshot.sources.length} external status sources connected
            </small>
          </span>
        </div>
      </section>

      <div className="fi-dashboard-grid">
        <section className="fi-glass-card fi-system-card" aria-labelledby="today-title">
          <div className="fi-card-heading">
            <div>
              <span className="fi-eyebrow">Founder control tower</span>
              <h2 id="today-title">Today</h2>
            </div>
            <span className="fi-system-orb">R</span>
          </div>
          <div className="fi-system-list">
            <div>
              <span>Open work</span>
              <strong>{work.state === "operational" ? work.counts.open : "—"}</strong>
            </div>
            <div>
              <span>Due today</span>
              <strong>{work.state === "operational" ? work.counts.dueToday : "—"}</strong>
            </div>
            <div>
              <span>Overdue / blocked</span>
              <strong>
                {work.state === "operational" ? `${work.counts.overdue} / ${work.counts.blocked}` : "—"}
              </strong>
            </div>
            <div>
              <span>Pending approvals</span>
              <strong>{pendingApprovals?.value ?? "—"}</strong>
            </div>
            <div>
              <span>Pending RINPO actions</span>
              <strong>{pendingActions?.value ?? "—"}</strong>
            </div>
            <div>
              <span>RINPO provider</span>
              <strong>
                {selectedProvider
                  ? `${selectedProvider.provider.toUpperCase()} · ${selectedProvider.model}`
                  : "—"}
              </strong>
            </div>
          </div>
          <p>Direct production facts only. No model-generated urgency or invented health score.</p>
        </section>

        <section className="fi-glass-card fi-system-card" aria-labelledby="attention-title">
          <div className="fi-card-heading">
            <div>
              <span className="fi-eyebrow">Exceptions first</span>
              <h2 id="attention-title">Attention</h2>
            </div>
            <span className="fi-count">{attention.length}</span>
          </div>
          {attention.length === 0 ? (
            <p>No exceptions were returned by the connected control-plane sources.</p>
          ) : (
            <div className="fi-system-list">
              {attention.slice(0, 8).map((item) => {
                const content = (
                  <>
                    <span>{item.label}</span>
                    <strong>
                      <StatusDot state={item.state} />
                      {stateLabels[item.state]}
                    </strong>
                  </>
                );
                return item.href ? (
                  item.href.startsWith("http") ? (
                    <a href={item.href} key={item.id} target="_blank" rel="noreferrer" title={item.detail}>
                      {content}
                    </a>
                  ) : (
                    <Link href={item.href} key={item.id} title={item.detail}>
                      {content}
                    </Link>
                  )
                ) : (
                  <div key={item.id} title={item.detail}>
                    {content}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="fi-glass-card fi-system-card" aria-labelledby="work-title">
          <div className="fi-card-heading">
            <div>
              <span className="fi-eyebrow">Canonical operations</span>
              <h2 id="work-title">Work pulse</h2>
            </div>
            <span className={`fi-status-pill fi-status-${work.state}`}>
              <StatusDot state={work.state} />
              {stateLabels[work.state]}
            </span>
          </div>
          {work.state !== "operational" ? (
            <p>{work.detail}</p>
          ) : work.tasks.length === 0 ? (
            <p>No open operational tasks were returned.</p>
          ) : (
            <div className="fi-system-list">
              {work.tasks.slice(0, 8).map((task) => (
                <Link href={`/tenants/${task.organizationId}`} key={task.id}>
                  <span title={task.title}>{task.organizationName} · {task.title}</span>
                  <strong>{task.priority} · {task.status.replaceAll("_", " ")}</strong>
                </Link>
              ))}
            </div>
          )}
          {work.state === "operational" ? (
            <p>
              Urgent {work.counts.urgent} · Unacknowledged alerts {work.counts.unacknowledgedAlerts}
            </p>
          ) : null}
        </section>

        <section className="fi-source-grid" aria-label="Live platform status">
          {snapshot.sources.map((source) => (
            <SourceCard source={source} key={source.id} />
          ))}
        </section>

        <div className="fi-mascot-stage" aria-label="RINPO, RINADS operations copilot">
          <span className="fi-mascot-aura" aria-hidden="true" />
          <Image
            src="/assets/rinpo-founder.png"
            alt="RINPO operations copilot in a black hoodie with purple circuit lines"
            width={768}
            height={1024}
            priority
            className="fi-mascot"
          />
          <div className="fi-rinpo-promise">
            <span className="fi-status-dot fi-status-operational" />
            <span>
              <strong>Only real platform data</strong>
              <small>No forecasts or invented metrics</small>
            </span>
          </div>
        </div>

        <section className="fi-workspaces" aria-labelledby="workspace-title">
          <div className="fi-section-heading">
            <div>
              <span className="fi-eyebrow">Kernel registry</span>
              <h2 id="workspace-title">Workspaces</h2>
            </div>
            <span className="fi-count">{workspaces.length}</span>
          </div>
          {snapshot.workspaceResult.state !== "operational" ? (
            <div className="fi-glass-card fi-empty-card">
              <strong>{stateLabels[snapshot.workspaceResult.state]}</strong>
              <p>{snapshot.workspaceResult.detail}</p>
            </div>
          ) : workspaces.length === 0 ? (
            <div className="fi-glass-card fi-empty-card">
              <strong>No workspaces returned</strong>
              <p>The connected kernel registry currently has no workspace rows.</p>
            </div>
          ) : (
            <div className="fi-workspace-list">
              {workspaces.slice(0, 4).map((workspace) => (
                <WorkspaceCard workspace={workspace} key={workspace.id} />
              ))}
            </div>
          )}
        </section>

        <ArchitectureMap sources={snapshot.sources} />

        <section className="fi-glass-card fi-controls" id="controls" aria-labelledby="controls-title">
          <div>
            <span className="fi-eyebrow">Founder controls</span>
            <h2 id="controls-title">Open a RINADS surface</h2>
          </div>
          <div className="fi-control-grid">
            {controls.map((control) => (
              <a href={control.href} key={control.label} target="_blank" rel="noreferrer">
                <span>{control.icon}</span>
                <strong>{control.label}</strong>
                <small>Open ↗</small>
              </a>
            ))}
          </div>
        </section>

        <section className="fi-glass-card fi-system-card" aria-labelledby="system-title">
          <div className="fi-card-heading">
            <div>
              <span className="fi-eyebrow">System status</span>
              <h2 id="system-title">Connection truth</h2>
            </div>
            <span className="fi-system-orb">R</span>
          </div>
          <div className="fi-system-list">
            {snapshot.sources.map((source) => (
              <div key={source.id}>
                <span>{source.label}</span>
                <strong>
                  <StatusDot state={source.state} />
                  {stateLabels[source.state]}
                </strong>
              </div>
            ))}
            <div>
              <span>Operational work</span>
              <strong>
                <StatusDot state={work.state} />
                {stateLabels[work.state]}
              </strong>
            </div>
          </div>
          <p>
            {allConnected
              ? "All configured systems report operational."
              : "Unconfigured or degraded sources remain explicit."}
          </p>
        </section>
      </div>

      <footer className="fi-presence-dock">
        <span className="fi-avatar">FI</span>
        <span className="fi-avatar fi-avatar-purple">R</span>
        <span className="fi-avatar">DB</span>
        <span className="fi-avatar">WWW</span>
        <span className="fi-presence-copy">
          <strong>Snapshot refreshed on request</strong>
          <small>{new Date(snapshot.checkedAt).toLocaleString("en-IN")}</small>
        </span>
      </footer>
    </div>
  );
}
