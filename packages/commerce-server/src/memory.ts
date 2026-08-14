import type { CommerceRepository, CommerceStore } from "@rinads/commerce";
import { createAmbadySeedStore } from "./seed";

let globalStore: CommerceStore = createAmbadySeedStore();
const orderCounters: Record<string, number> = {};
let idCounter = 1000;

export function createInMemoryRepository(initial?: CommerceStore): CommerceRepository {
  if (initial) globalStore = structuredClone(initial);

  return {
    getStore: () => globalStore,
    saveStore: (store) => {
      globalStore = store;
    },
    nextId: (prefix) => `${prefix}_${++idCounter}`,
    nextOrderNumber: (orgId) => {
      orderCounters[orgId] = (orderCounters[orgId] ?? 1000) + 1;
      return `AMB-${orderCounters[orgId]}`;
    },
  };
}

export function resetCommerceStore(): void {
  globalStore = createAmbadySeedStore();
  Object.keys(orderCounters).forEach((k) => delete orderCounters[k]);
  idCounter = 1000;
}

export { createAmbadySeedStore, AMBADY_ORG_ID, DEMO_CUSTOMER_ID } from "./seed";
