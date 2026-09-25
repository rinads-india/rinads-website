import { Badge, Card, EmptyState } from "@rinads/ui";
import { listCustomerAddresses, portalContext } from "@/lib/commerce";

export default function AddressesPage() {
  const ctx = portalContext();
  const addresses = listCustomerAddresses(ctx);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Addresses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Saved delivery addresses for your account.
        </p>
      </header>

      {addresses.length === 0 ? (
        <EmptyState
          title="No addresses saved"
          description="Add an address during checkout to see it here."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id}>
              <Card className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-foreground">
                    {address.label ?? "Address"}
                  </p>
                  {address.isDefault ? <Badge tone="success">Default</Badge> : null}
                </div>
                <p className="text-sm text-foreground">{address.name}</p>
                <p className="text-sm text-muted-foreground">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                  <br />
                  {address.city}, {address.state} {address.pincode}
                  <br />
                  {address.phone}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
