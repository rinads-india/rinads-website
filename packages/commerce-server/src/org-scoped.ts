import type { CommerceRepository, CommerceStore } from "@rinads/commerce";
import { createAmbadySeedStore } from "./seed";

const orgStores = new Map<string, CommerceStore>();
const orderCounters: Record<string, number> = {};
let idCounter = 1000;

function buildRepository(orgId: string, store: CommerceStore): CommerceRepository {
  return {
    getStore: () => store,
    saveStore: (next) => {
      orgStores.set(orgId, next);
    },
    nextId: (prefix) => `${prefix}_${++idCounter}`,
    nextOrderNumber: (oid) => {
      orderCounters[oid] = (orderCounters[oid] ?? 1000) + 1;
      return `ORD-${orderCounters[oid]}`;
    },
  };
}

export function createOrgScopedCommerceRepository(
  organizationId: string,
  initial?: CommerceStore
): CommerceRepository {
  if (!orgStores.has(organizationId)) {
    orgStores.set(organizationId, initial ? structuredClone(initial) : createAmbadySeedStore());
  }
  const store = orgStores.get(organizationId)!;
  return buildRepository(organizationId, store);
}

export function seedOrgCommerceStore(organizationId: string, store: CommerceStore): CommerceRepository {
  orgStores.set(organizationId, structuredClone(store));
  return buildRepository(organizationId, orgStores.get(organizationId)!);
}

export function resetOrgCommerceStores(): void {
  orgStores.clear();
  Object.keys(orderCounters).forEach((k) => delete orderCounters[k]);
  idCounter = 1000;
}

export function getOrgCommerceStore(organizationId: string): CommerceStore | undefined {
  return orgStores.get(organizationId);
}
