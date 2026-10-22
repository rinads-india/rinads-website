export type LogisticsProviderState =
  | "not_configured"
  | "credentials_detected"
  | "verification_pending"
  | "live";

export type LogisticsProviderReadiness = {
  key: string;
  label: string;
  role: string;
  capabilities: string[];
  requiredEnv: string[];
  credentialsDetected: boolean;
  adapterImplemented: boolean;
  liveVerified: boolean;
  state: LogisticsProviderState;
};

type ProviderDefinition = Omit<
  LogisticsProviderReadiness,
  "credentialsDetected" | "liveVerified" | "state"
> & {
  liveFlag: string;
};

const PROVIDERS: ProviderDefinition[] = [
  {
    key: "dtdc",
    label: "DTDC",
    role: "National parcel / documents",
    capabilities: ["cod", "reverse", "scheduled"],
    requiredEnv: ["RINADS_DTDC_API_TOKEN"],
    adapterImplemented: false,
    liveFlag: "RINADS_DTDC_LIVE",
  },
  {
    key: "delhivery",
    label: "Delhivery",
    role: "E-commerce / national parcel",
    capabilities: ["cod", "reverse", "scheduled"],
    requiredEnv: ["RINADS_DELHIVERY_API_TOKEN"],
    adapterImplemented: false,
    liveFlag: "RINADS_DELHIVERY_LIVE",
  },
  {
    key: "porter",
    label: "Porter Enterprise",
    role: "Local / on-demand movement",
    capabilities: ["same_day", "scheduled"],
    requiredEnv: ["RINADS_PORTER_API_KEY", "RINADS_PORTER_API_SECRET"],
    adapterImplemented: false,
    liveFlag: "RINADS_PORTER_LIVE",
  },
  {
    key: "ondc_delivery",
    label: "ONDC Delivery",
    role: "Network logistics discovery / orchestration",
    capabilities: ["same_day", "scheduled", "reverse"],
    requiredEnv: ["RINADS_ONDC_SUBSCRIBER_ID", "RINADS_ONDC_SIGNING_PRIVATE_KEY"],
    adapterImplemented: false,
    liveFlag: "RINADS_ONDC_DELIVERY_LIVE",
  },
  {
    key: "shiprocket",
    label: "Shiprocket",
    role: "Aggregator fallback",
    capabilities: ["cod", "reverse", "scheduled"],
    requiredEnv: ["RINADS_SHIPROCKET_API_TOKEN"],
    adapterImplemented: false,
    liveFlag: "RINADS_SHIPROCKET_LIVE",
  },
  {
    key: "sequel",
    label: "Sequel",
    role: "High-value logistics",
    capabilities: ["high_value", "reverse", "scheduled"],
    requiredEnv: ["RINADS_SEQUEL_API_TOKEN"],
    adapterImplemented: false,
    liveFlag: "RINADS_SEQUEL_LIVE",
  },
  {
    key: "bvc",
    label: "BVC",
    role: "High-value logistics",
    capabilities: ["high_value", "reverse", "scheduled"],
    requiredEnv: ["RINADS_BVC_API_TOKEN"],
    adapterImplemented: false,
    liveFlag: "RINADS_BVC_LIVE",
  },
  {
    key: "local_fleet",
    label: "Local Fleet",
    role: "RINADS / partner driver network",
    capabilities: ["same_day", "scheduled", "reverse"],
    requiredEnv: [],
    adapterImplemented: false,
    liveFlag: "RINADS_LOCAL_FLEET_LIVE",
  },
];

function envPresent(key: string): boolean {
  return Boolean(process.env[key]?.trim());
}

export function getLogisticsProviderReadiness(): LogisticsProviderReadiness[] {
  return PROVIDERS.map((provider) => {
    const credentialsDetected =
      provider.requiredEnv.length > 0 && provider.requiredEnv.every(envPresent);
    const liveVerified =
      provider.adapterImplemented && credentialsDetected && process.env[provider.liveFlag] === "1";

    let state: LogisticsProviderState = "not_configured";
    if (credentialsDetected) state = "credentials_detected";
    if (provider.adapterImplemented && credentialsDetected) state = "verification_pending";
    if (liveVerified) state = "live";

    return {
      key: provider.key,
      label: provider.label,
      role: provider.role,
      capabilities: provider.capabilities,
      requiredEnv: provider.requiredEnv,
      credentialsDetected,
      adapterImplemented: provider.adapterImplemented,
      liveVerified,
      state,
    };
  });
}

export function getLogisticsOsSnapshot() {
  const providers = getLogisticsProviderReadiness();
  return {
    providers,
    registeredProviders: providers.length,
    credentialedProviders: providers.filter((provider) => provider.credentialsDetected).length,
    liveProviders: providers.filter((provider) => provider.liveVerified).length,
    routingStrategies: ["priority", "lowest_cost", "fastest", "intelligence"] as const,
    executionMode: "fail_closed" as const,
  };
}
