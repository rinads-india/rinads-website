import Image from "next/image";
import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { loadFounderIntelligenceSnapshot } from "@/lib/founder-intelligence/adapters";
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
  const snapshot = await loadFounderIntelligenceSnapshot();
  const workspaces =
    snapshot.workspaceResult.state === "operational"
      ? snapshot.workspaceResult.workspaces
      : [];
  const allConnected =
    snapshot.sources.every((source) => source.state === "operational") &&
    snapshot.workspaceResult.state === "operational";
  const connectedCount = snapshot.sources.filter(
    (source) => source.state !== "not_connected"
  ).length;

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
          <p>One truthful view of the RINADS platform, its workspaces, deployments, and runtime.</p>
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
          </div>
          <p>
            {allConnected
              ? "All configured systems report operational."
              : "Unconfigured sources remain explicitly disconnected."}
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
