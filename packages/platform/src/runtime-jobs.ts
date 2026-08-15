export type ProvisioningJobRow = {
  id: string;
  organization_id: string;
  template_key: string;
  status: "pending" | "running" | "completed" | "failed";
  error_message?: string | null;
};

export type ProvisioningJobClient = {
  from: (table: string) => {
    select: (cols?: string) => {
      eq: (col: string, val: string) => Promise<{ data: ProvisioningJobRow[] | null; error: { message: string } | null }>;
    };
    update: (row: Partial<ProvisioningJobRow>) => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
  };
};

export async function markProvisioningJobRunning(
  client: ProvisioningJobClient,
  jobId: string
): Promise<boolean> {
  const { error } = await client.from("tenant_provisioning_jobs").update({ status: "running" }).eq("id", jobId);
  return !error;
}

export async function completeProvisioningJob(
  client: ProvisioningJobClient,
  jobId: string,
  errorMessage?: string
): Promise<boolean> {
  const { error } = await client
    .from("tenant_provisioning_jobs")
    .update({
      status: errorMessage ? "failed" : "completed",
      error_message: errorMessage ?? null,
    })
    .eq("id", jobId);
  return !error;
}

export async function listPendingProvisioningJobs(
  client: ProvisioningJobClient,
  organizationId: string
): Promise<ProvisioningJobRow[]> {
  const { data } = await client
    .from("tenant_provisioning_jobs")
    .select("*")
    .eq("organization_id", organizationId);
  return (data ?? []).filter((j) => j.status === "pending" || j.status === "running");
}
