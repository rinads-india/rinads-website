import type { OperationsRepository, OperationsStore } from "@rinads/operations";
import { createAmbadyOperationsSeed } from "./seed";

let globalStore: OperationsStore = createAmbadyOperationsSeed();
const docCounters: Record<string, number> = {};
let idCounter = 5000;

export function createInMemoryOperationsRepository(initial?: OperationsStore): OperationsRepository {
  if (initial) globalStore = structuredClone(initial);

  return {
    getStore: () => globalStore,
    saveStore: (store) => {
      globalStore = store;
    },
    nextId: (prefix) => `${prefix}_${++idCounter}`,
    nextDocumentNumber: (orgId, documentType, prefix) => {
      const store = globalStore;
      let seq = store.documentSequences.find(
        (s) => s.organizationId === orgId && s.documentType === documentType
      );
      if (!seq) {
        seq = {
          id: `ds_${documentType}`,
          organizationId: orgId,
          documentType,
          prefix,
          nextNumber: 1000,
        };
        store.documentSequences.push(seq);
      }
      const num = seq.nextNumber++;
      const key = `${orgId}:${documentType}`;
      docCounters[key] = num;
      globalStore = store;
      return `${prefix}-${num}`;
    },
  };
}

export function resetOperationsStore(): void {
  globalStore = createAmbadyOperationsSeed();
  Object.keys(docCounters).forEach((k) => delete docCounters[k]);
  idCounter = 5000;
}

export { createAmbadyOperationsSeed } from "./seed";
