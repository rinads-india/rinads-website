"use server";

import { executeRinpoTool, type RinpoToolInput } from "@rinads/intelligence";
import { commerce, portalContext } from "@/lib/commerce";

export async function runRinpoTool(input: RinpoToolInput) {
  const ctx = portalContext();
  return executeRinpoTool(
    {
      catalog: commerce.catalog,
      cart: commerce.cart,
      order: commerce.order,
      support: commerce.support,
    },
    ctx,
    input
  );
}
