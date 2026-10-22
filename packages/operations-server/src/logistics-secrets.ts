import type {
  LogisticsCredentialSource,
  LogisticsProviderConfig,
} from "@rinads/operations";

export type LogisticsCredentialBindingStatus =
  | "resolved"
  | "no_credentials"
  | "unknown_binding"
  | "unsupported_source"
  | "credential_contract_pending"
  | "missing_secret";

export type LogisticsCredentialBundle = {
  providerKey: string;
  bindingId: string;
  source: "environment";
  values: Readonly<Record<string, string>>;
};

export type LogisticsCredentialResolution =
  | {
      ok: true;
      status: "resolved";
      bundle: LogisticsCredentialBundle;
    }
  | {
      ok: false;
      status: Exclude<LogisticsCredentialBindingStatus, "resolved">;
      message: string;
      missingKeys?: string[];
    };

type EnvironmentBinding = {
  providerKey: string;
  bindingId: string;
  contractVerified: boolean;
  fields: Readonly<Record<string, string>>;
};

/**
 * Server-owned credential binding registry.
 *
 * Database `credential_key` values are opaque binding IDs such as
 * `delhivery_primary`. They are never environment-variable names and are never
 * dereferenced with process.env[tenantSuppliedValue]. This prevents a tenant
 * configuration row from becoming an arbitrary server-secret oracle.
 *
 * Add a provider binding only after its exact vendor authentication contract has
 * been verified from authoritative documentation/account onboarding.
 */
const ENVIRONMENT_BINDINGS: readonly EnvironmentBinding[] = [
  {
    providerKey: "delhivery",
    bindingId: "delhivery_primary",
    contractVerified: true,
    fields: {
      apiToken: "RINADS_DELHIVERY_API_TOKEN",
    },
  },
  {
    providerKey: "dtdc",
    bindingId: "dtdc_primary",
    contractVerified: false,
    fields: {},
  },
  {
    providerKey: "porter",
    bindingId: "porter_primary",
    contractVerified: false,
    fields: {},
  },
  {
    providerKey: "ondc_delivery",
    bindingId: "ondc_delivery_primary",
    contractVerified: false,
    fields: {},
  },
  {
    providerKey: "shiprocket",
    bindingId: "shiprocket_primary",
    contractVerified: true,
    fields: {
      email: "RINADS_SHIPROCKET_EMAIL",
      password: "RINADS_SHIPROCKET_PASSWORD",
    },
  },
  {
    providerKey: "sequel",
    bindingId: "sequel_primary",
    contractVerified: false,
    fields: {},
  },
  {
    providerKey: "bvc",
    bindingId: "bvc_primary",
    contractVerified: false,
    fields: {},
  },
];

function findEnvironmentBinding(
  providerKey: string,
  bindingId: string
): EnvironmentBinding | undefined {
  return ENVIRONMENT_BINDINGS.find(
    (binding) => binding.providerKey === providerKey && binding.bindingId === bindingId
  );
}

function resolveEnvironmentBinding(
  providerKey: string,
  bindingId: string,
  env: Readonly<Record<string, string | undefined>>
): LogisticsCredentialResolution {
  const binding = findEnvironmentBinding(providerKey, bindingId);
  if (!binding) {
    return {
      ok: false,
      status: "unknown_binding",
      message: `No server-owned logistics credential binding exists for ${providerKey}:${bindingId}.`,
    };
  }

  if (!binding.contractVerified) {
    return {
      ok: false,
      status: "credential_contract_pending",
      message: `The ${providerKey} credential contract has not passed provider verification.`,
    };
  }

  const values: Record<string, string> = {};
  const missingKeys: string[] = [];

  for (const [field, envKey] of Object.entries(binding.fields)) {
    const value = env[envKey]?.trim();
    if (!value) {
      missingKeys.push(envKey);
      continue;
    }
    values[field] = value;
  }

  if (missingKeys.length > 0) {
    return {
      ok: false,
      status: "missing_secret",
      message: `Required server-side credential material is missing for ${providerKey}:${bindingId}.`,
      missingKeys,
    };
  }

  return {
    ok: true,
    status: "resolved",
    bundle: {
      providerKey,
      bindingId,
      source: "environment",
      values: Object.freeze(values),
    },
  };
}

export function resolveLogisticsCredentialBinding(
  config: Pick<
    LogisticsProviderConfig,
    "providerKey" | "credentialSource" | "credentialKey"
  >,
  env: Readonly<Record<string, string | undefined>> = process.env
): LogisticsCredentialResolution {
  if (config.credentialSource === "none") {
    return {
      ok: false,
      status: "no_credentials",
      message: `Provider ${config.providerKey} has no external credential binding.`,
    };
  }

  if (!config.credentialKey?.trim()) {
    return {
      ok: false,
      status: "unknown_binding",
      message: `Provider ${config.providerKey} does not declare an opaque credential binding ID.`,
    };
  }

  if (config.credentialSource !== "environment") {
    return {
      ok: false,
      status: "unsupported_source",
      message: `Credential source ${config.credentialSource} is not wired into the logistics secret resolver yet.`,
    };
  }

  return resolveEnvironmentBinding(
    config.providerKey,
    config.credentialKey.trim(),
    env
  );
}

export function getLogisticsCredentialBindingMetadata(): Array<{
  providerKey: string;
  bindingId: string;
  source: LogisticsCredentialSource;
  contractVerified: boolean;
  requiredSecretNames: string[];
}> {
  return ENVIRONMENT_BINDINGS.map((binding) => ({
    providerKey: binding.providerKey,
    bindingId: binding.bindingId,
    source: "environment" as const,
    contractVerified: binding.contractVerified,
    requiredSecretNames: Object.values(binding.fields),
  }));
}
