export type FeatureFlagDefinition = {
  key: string;
  defaultEnabled: boolean;
};

export type FeatureFlagOverrides = {
  flagKey: string;
  organizationId?: string;
  userId?: string;
  enabled: boolean;
}[];
