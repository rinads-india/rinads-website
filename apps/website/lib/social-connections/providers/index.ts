/**
 * Provider adapter loader — SERVER ONLY.
 * Lazily loads adapters so non-Phase-1 providers don't add bundle weight.
 */
import type { SocialProviderAdapter } from "./registry";
import type { SocialProviderId } from "../types";
import { facebookAdapter } from "./facebook";
import { instagramAdapter } from "./instagram";

const ADAPTERS: Partial<Record<SocialProviderId, SocialProviderAdapter>> = {
  facebook: facebookAdapter,
  instagram: instagramAdapter,
};

export function getProviderAdapter(
  id: SocialProviderId
): SocialProviderAdapter | null {
  return ADAPTERS[id] ?? null;
}

export { getAllProviderMeta, PROVIDER_META, PHASE_1_PROVIDERS } from "./registry";
export type { SocialProviderAdapter } from "./registry";
