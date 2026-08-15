import { commerce, demoContext, AMBADY_ORG_ID } from "@rinads/operations-server";

export { commerce, demoContext, AMBADY_ORG_ID };

export function getCommerceContext() {
  return demoContext();
}
