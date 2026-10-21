import type { RiScope, RiSignal } from "./ri-types";

export type RiSignalProviderContext = {
  scope: RiScope;
  now: string;
};

export type RiSignalProvider = {
  key: string;
  metricKeys?: string[];
  collect(context: RiSignalProviderContext): Promise<RiSignal[]>;
};

export type RiSignalProviderFailure = {
  providerKey: string;
  error: unknown;
};

export async function collectRiSignals(input: {
  providers: RiSignalProvider[];
  context: Omit<RiSignalProviderContext, "now"> & { now?: string };
  onFailure?: (failure: RiSignalProviderFailure) => void;
}): Promise<RiSignal[]> {
  const context: RiSignalProviderContext = {
    ...input.context,
    now: input.context.now ?? new Date().toISOString(),
  };

  const settled = await Promise.allSettled(
    input.providers.map(async (provider) => ({
      provider,
      signals: await provider.collect(context),
    }))
  );

  const signals: RiSignal[] = [];
  settled.forEach((result, index) => {
    if (result.status === "fulfilled") {
      signals.push(...result.value.signals);
      return;
    }

    input.onFailure?.({
      providerKey: input.providers[index]?.key ?? `provider:${index}`,
      error: result.reason,
    });
  });

  return signals.sort((a, b) => a.id.localeCompare(b.id));
}
