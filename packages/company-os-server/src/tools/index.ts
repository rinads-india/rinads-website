import type { DomainTool } from "@rinads/company-os-engine";
import type { Env } from "../kit";
import { crmTools } from "./crm";
import { deliveryTools } from "./delivery";
import { financeTools } from "./finance";
import { peopleTools } from "./people";
import { studioTools } from "./studio";

/** Every registered Company OS domain tool, keyed by governed action key. */
export function createDomainTools(env: Env): Record<string, DomainTool> {
  const all = [...crmTools(env), ...deliveryTools(env), ...financeTools(env), ...studioTools(env), ...peopleTools(env)];
  return Object.fromEntries(all.map((t) => [t.key, t]));
}
