import type { RinpoToolName } from "./types";

export type RinpoToolCategory = "READ" | "DRAFT" | "ACTION";

export type RinpoToolDefinition = {
  key: RinpoToolName | string;
  category: RinpoToolCategory;
  description: string;
  requiredPermission?: string;
  customerFacing?: boolean;
  ownerOnly?: boolean;
};

const REGISTRY: RinpoToolDefinition[] = [
  { key: "similar_products", category: "READ", description: "Related catalog products", customerFacing: true },
  { key: "compare_variants", category: "READ", description: "Variant comparison for a product", customerFacing: true },
  { key: "add_to_cart", category: "DRAFT", description: "Add variant to cart (draft until checkout)", customerFacing: true },
  { key: "order_status", category: "READ", description: "Order tracking for customer", customerFacing: true },
  { key: "create_ticket", category: "DRAFT", description: "Create support ticket", customerFacing: true },
  { key: "ops_daily_briefing", category: "READ", description: "Owner operational daily brief", ownerOnly: true, requiredPermission: "org.manage" },
  { key: "ops_low_stock", category: "READ", description: "List low-stock SKUs", ownerOnly: true, requiredPermission: "org.manage" },
  { key: "ops_pending_po", category: "READ", description: "Purchase orders awaiting approval", ownerOnly: true, requiredPermission: "org.manage" },
  { key: "ops_propose_adjustment", category: "DRAFT", description: "Propose inventory adjustment", ownerOnly: true, requiredPermission: "org.manage" },
  { key: "ops_confirm_proposal", category: "ACTION", description: "Execute confirmed inventory adjustment", ownerOnly: true, requiredPermission: "org.manage" },
];

export function listRinpoTools(filter?: { ownerOnly?: boolean; customerFacing?: boolean }): RinpoToolDefinition[] {
  return REGISTRY.filter((t) => {
    if (filter?.ownerOnly && !t.ownerOnly) return false;
    if (filter?.customerFacing && !t.customerFacing) return false;
    return true;
  });
}

export function getRinpoTool(key: string): RinpoToolDefinition | undefined {
  return REGISTRY.find((t) => t.key === key);
}

export function isRegisteredRinpoTool(key: string): boolean {
  return REGISTRY.some((t) => t.key === key);
}
