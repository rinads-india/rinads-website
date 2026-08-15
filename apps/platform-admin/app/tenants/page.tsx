import Link from "next/link";
import { listTenantsAction } from "../actions/tenants";

export default async function TenantsPage() {
  const result = await listTenantsAction();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Tenants</h2>
        <Link href="/tenants/new" className="rounded-md bg-rinads-primary px-4 py-2 text-sm font-medium text-white">
          Provision tenant
        </Link>
      </div>

      {!result.ok ? (
        <p className="text-sm text-red-400">{result.error}</p>
      ) : (
        <div className="card overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {result.tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td>{tenant.name}</td>
                  <td>{tenant.slug}</td>
                  <td>{tenant.status}</td>
                  <td>
                    <Link href={`/tenants/${tenant.id}`} className="text-rinads-primary">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
