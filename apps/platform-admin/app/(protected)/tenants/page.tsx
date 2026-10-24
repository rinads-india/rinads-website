import Link from "next/link";
import {
  listProvisioningJobsAction,
  listTenantsAction,
  retryDeadLetteredProvisioningJobAction,
} from "@/app/actions/tenants";

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-IN");
}

export default async function TenantsPage() {
  const [result, provisioning] = await Promise.all([
    listTenantsAction(),
    listProvisioningJobsAction(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Tenants</h2>
          <p className="mt-1 text-sm text-white/60">
            RI ID organizations, activation and durable provisioning control plane.
          </p>
        </div>
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

      <section className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold">Provisioning health</h3>
          <p className="mt-1 text-sm text-white/60">
            Idempotent tenant setup jobs. Retry is intentionally available only after dead-lettering.
          </p>
        </div>

        {!provisioning.ok ? (
          <p className="text-sm text-red-400">{provisioning.error}</p>
        ) : provisioning.jobs.length === 0 ? (
          <div className="card text-sm text-white/60">No provisioning jobs found.</div>
        ) : (
          <div className="card overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Template</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th>Next retry</th>
                  <th>Last error</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {provisioning.jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="font-mono text-xs">{job.organizationId}</td>
                    <td>{job.templateKey}</td>
                    <td>
                      <span className="rounded-full border border-white/10 px-2 py-1 text-xs">
                        {job.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td>{job.attempts}</td>
                    <td>{formatDate(job.nextAttemptAt)}</td>
                    <td className="max-w-xs">
                      <div className="truncate text-xs text-white/70" title={job.errorMessage}>
                        {job.lastErrorClass ? `${job.lastErrorClass}: ` : ""}
                        {job.errorMessage ?? "—"}
                      </div>
                    </td>
                    <td>
                      {job.status === "dead_letter" ? (
                        <form action={retryDeadLetteredProvisioningJobAction.bind(null, job.id)}>
                          <button
                            type="submit"
                            className="rounded-md border border-rinads-primary px-3 py-1.5 text-xs font-semibold text-rinads-primary"
                          >
                            Retry safely
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-white/40">Automatic</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
