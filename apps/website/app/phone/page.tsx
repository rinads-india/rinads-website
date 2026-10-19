import Link from "next/link";
import { redirect } from "next/navigation";
import { RINPOAvatar } from "@/components/system";
import { resolveRinpoPhoneAccess } from "@/lib/rinpo-phone/access";
import { resolveRinpoPhoneHome } from "@/lib/rinpo-phone/home";

const INTERNAL_TABS = new Set(["today", "apps", "world", "settings"]);

type PhonePageProps = {
  searchParams: Promise<{ tab?: string }>;
};

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
      {children}
    </span>
  );
}

export default async function RinpoPhonePage({ searchParams }: PhonePageProps) {
  const access = await resolveRinpoPhoneAccess();

  if (access.status === "unauthenticated") {
    redirect(`/signup?mode=login&next=${encodeURIComponent("/phone")}`);
  }

  if (access.status === "unavailable") {
    return (
      <main className="min-h-screen bg-[#08070d] px-6 py-16 text-white">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">
            RINPO Phone
          </p>
          <h1 className="mt-4 text-3xl font-semibold">Authentication required</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">{access.reason}</p>
        </div>
      </main>
    );
  }

  const home = resolveRinpoPhoneHome(access.homeInput);
  const requestedTab = (await searchParams).tab ?? "today";
  const activeTab = INTERNAL_TABS.has(requestedTab) ? requestedTab : "today";
  const workspaceLabel = access.organizationName ?? "Personal workspace";
  const roleLabel = access.roleKey ?? "personal";

  return (
    <main className="min-h-screen bg-[#08070d] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col border-x border-white/5 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.22),_transparent_42%)] shadow-2xl shadow-black/50">
        <header className="flex items-center justify-between px-5 pb-3 pt-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-300">
              RINPO Phone
            </p>
            <h1 className="mt-1 text-xl font-semibold">{workspaceLabel}</h1>
          </div>
          <div className="h-14 w-14 overflow-hidden rounded-2xl border border-violet-400/20 bg-violet-500/10">
            <RINPOAvatar variant="avatar" className="h-full w-full" alt="RINPO" />
          </div>
        </header>

        <div className="flex gap-2 overflow-x-auto px-5 pb-5">
          <StatusPill>{home.workspace.type}</StatusPill>
          <StatusPill>{roleLabel}</StatusPill>
          <StatusPill>M1 web shell</StatusPill>
        </div>

        <section className="flex-1 px-5 pb-28">
          {activeTab === "today" ? (
            <div className="space-y-5">
              <div className="rounded-[1.75rem] border border-violet-300/15 bg-gradient-to-br from-violet-500/15 to-white/[0.03] p-5">
                <p className="text-sm font-medium text-violet-200">Today</p>
                <h2 className="mt-2 text-2xl font-semibold">Your business, simplified.</h2>
                <p className="mt-3 text-sm leading-6 text-white/60">
                  This shell is resolved from your authenticated workspace, role and permissions.
                  RINPO actions remain governed by the existing RINADS Runtime and approval boundaries.
                </p>
                <Link
                  href="/rinpo/live"
                  className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
                >
                  Ask RINPO
                </Link>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Available now</h2>
                  <Link href="/phone?tab=apps" className="text-xs text-violet-300">
                    View apps
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {home.apps.map((app) => (
                    <Link
                      key={app.id}
                      href={app.route}
                      className="min-h-28 rounded-3xl border border-white/10 bg-white/[0.045] p-4 transition hover:border-violet-300/30 hover:bg-white/[0.07]"
                    >
                      <p className="text-xs uppercase tracking-[0.16em] text-white/35">
                        {app.category}
                      </p>
                      <p className="mt-3 font-semibold">{app.name}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "apps" ? (
            <div>
              <h2 className="text-2xl font-semibold">Apps</h2>
              <p className="mt-2 text-sm leading-6 text-white/55">
                Apps are resolved server-side from the current workspace context. This is not a
                public mini-app marketplace.
              </p>
              <div className="mt-5 space-y-3">
                {home.apps.map((app) => (
                  <Link
                    key={app.id}
                    href={app.route}
                    className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div>
                      <p className="font-semibold">{app.name}</p>
                      <p className="mt-1 text-xs text-white/40">{app.category}</p>
                    </div>
                    <span className="text-violet-300">Open</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "world" ? (
            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
                World bridge
              </p>
              <h2 className="mt-3 text-2xl font-semibold">RINADS WORLD stays isolated.</h2>
              <p className="mt-3 text-sm leading-6 text-white/55">
                WORLD will use the same identity and permission contracts, but it cannot request
                unrestricted tenant memory. Live WORLD linking remains intentionally deferred.
              </p>
            </div>
          ) : null}

          {activeTab === "settings" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold">Settings</h2>
                <p className="mt-2 text-sm text-white/50">Identity and device boundary status.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <dl className="space-y-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-white/45">Workspace</dt>
                    <dd>{workspaceLabel}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-white/45">Role</dt>
                    <dd>{roleLabel}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-white/45">RINPO ID</dt>
                    <dd className="text-amber-200">provisional</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-white/45">Device</dt>
                    <dd className="text-amber-200">unregistered web</dd>
                  </div>
                </dl>
              </div>
              <p className="text-xs leading-5 text-white/35">
                Persistent RINPO identity, device registration, privacy controls and revocation are
                deferred until the active Company OS/security schema is reconciled. No parallel
                identity tables are created by this slice.
              </p>
            </div>
          ) : null}
        </section>

        <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md border-t border-white/10 bg-[#08070d]/95 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
          <div className="grid grid-cols-4 gap-1">
            {[
              ["today", "Today"],
              ["apps", "Apps"],
              ["world", "World"],
              ["settings", "Settings"],
            ].map(([tab, label]) => (
              <Link
                key={tab}
                href={`/phone?tab=${tab}`}
                className={`rounded-2xl px-2 py-3 text-center text-xs font-medium ${
                  activeTab === tab ? "bg-violet-500/20 text-violet-200" : "text-white/45"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </main>
  );
}
