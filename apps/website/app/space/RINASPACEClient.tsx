"use client";

type AppEntry = {
  id: string;
  label: string;
  description: string;
  href: string;
  roles: string[];
  status: "live" | "preview" | "soon";
};

const APPS: AppEntry[] = [
  { id: "business-os", label: "Business OS", description: "Run your entire company from one workspace.", href: "/os", roles: ["owner", "admin", "staff"], status: "live" },
  { id: "rinpo", label: "RINPO Intelligence", description: "AI-powered decisions and business insights.", href: "/os/rinpo", roles: ["owner", "admin"], status: "preview" },
  { id: "orders", label: "Service Orders", description: "Track and manage all service orders.", href: "/os/orders", roles: ["owner", "admin", "staff"], status: "live" },
  { id: "team", label: "Team", description: "Manage your team, roles, and assignments.", href: "/os/team", roles: ["owner", "admin"], status: "live" },
  { id: "payments", label: "Payments", description: "View invoices, payments, and revenue.", href: "/os/payments", roles: ["owner", "admin"], status: "live" },
  { id: "world", label: "RINADS WORLD", description: "Enter the immersive RINADS universe.", href: "/world", roles: ["owner", "admin", "staff", "customer"], status: "preview" },
  { id: "marketplace", label: "RI Marketplace", description: "Browse and purchase RINADS services.", href: "/services", roles: ["owner", "admin", "staff", "customer"], status: "live" },
  { id: "notifications", label: "Notifications", description: "WhatsApp and system notifications.", href: "/os/notifications", roles: ["owner", "admin"], status: "live" },
];

type Props = {
  role: string;
  orgName: string;
};

const STATUS_BADGE: Record<string, string> = {
  live: "bg-green-100 text-green-700",
  preview: "bg-yellow-100 text-yellow-700",
  soon: "bg-gray-100 text-gray-500",
};

export function RINASPACEClient({ role, orgName }: Props) {
  const normalizedRole = role.toLowerCase();
  const visibleApps = APPS.filter((a) =>
    a.roles.some((r) => r === normalizedRole || normalizedRole === "owner")
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">RINASPACE</h1>
        <p className="text-gray-500 mt-1">
          {orgName} · <span className="capitalize">{role}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleApps.map((app) => (
          <a
            key={app.id}
            href={app.href}
            className="group block p-5 rounded-xl border border-gray-200 hover:border-black transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="font-semibold text-gray-900 group-hover:text-black">{app.label}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[app.status]}`}>
                {app.status === "live" ? "Live" : app.status === "preview" ? "Preview" : "Soon"}
              </span>
            </div>
            <p className="text-sm text-gray-500">{app.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
