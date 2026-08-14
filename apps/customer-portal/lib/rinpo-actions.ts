"use server";

import { executeRinpoTool, type RinpoToolInput, type RinpoToolResult } from "@rinads/intelligence";
import { commerce, portalContext } from "@/lib/commerce";

export async function runRinpoToolAction(input: RinpoToolInput): Promise<RinpoToolResult> {
  return executeRinpoTool(
    {
      catalog: commerce.catalog,
      cart: commerce.cart,
      order: commerce.order,
      support: commerce.support,
    },
    portalContext(),
    input
  );
}
