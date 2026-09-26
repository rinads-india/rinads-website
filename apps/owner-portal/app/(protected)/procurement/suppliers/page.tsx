import Link from "next/link";
import { Card } from "@rinads/ui";
import { operations, opsContext } from "@/lib/commerce";

export default function SuppliersPage() {
  const ctx = opsContext();
  const suppliers = operations.suppliers.list(ctx);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Suppliers</h2>
      <Card className="overflow-x-auto p-0">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>GSTIN</th>
              <th>Terms</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id}>
                <td className="font-medium">{s.name}</td>
                <td>{s.contactName ?? s.email ?? "—"}</td>
                <td>{s.gstin ?? "—"}</td>
                <td>{s.paymentTerms ?? "—"}</td>
                <td>{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Link href="/procurement/purchase-orders" className="text-sm text-rinads-primary hover:underline">
        View purchase orders →
      </Link>
    </div>
  );
}
