import { Badge, Card, EmptyState } from "@rinads/ui";
import { getCustomerProfile, portalContext } from "@/lib/commerce";

export default function ProfilePage() {
  const ctx = portalContext();
  const profile = getCustomerProfile(ctx);

  if (!profile) {
    return (
      <EmptyState
        title="Profile not found"
        description="No customer profile is linked to this demo account."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your Ambady account details.
        </p>
      </header>

      <Card className="max-w-lg space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Customer ID
          </p>
          <p className="font-mono text-sm text-foreground">{profile.id}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Email
          </p>
          <p className="text-foreground">{profile.email ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Phone
          </p>
          <p className="text-foreground">{profile.phone ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Marketing preferences
          </p>
          <Badge tone={profile.marketingOptIn ? "success" : "default"}>
            {profile.marketingOptIn ? "Opted in" : "Opted out"}
          </Badge>
        </div>
      </Card>
    </div>
  );
}
