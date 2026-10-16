import { OsModuleBridge } from "@/components/os/OsModuleBridge";
import { LinkButton, OsPage, Panel } from "@/components/os/company/ui";
import { getAutomateModuleDestinations } from "@/lib/os-module-destinations";

export const dynamic = "force-dynamic";

export default function PlatformsPage() {
  return (
    <OsPage title="Platforms" eyebrow="Connected products" summary="RINADS products and automation surfaces that run on the same cloud: storefronts, portals, workflows and runtime approvals. Each keeps its own authorization; this page only links to what your role may open." actions={<LinkButton href="/os/approvals">Governed approvals</LinkButton>}>
      <Panel id="boundary" title="One runtime, many surfaces">
        <p className="text-sm text-gray-700">Material actions from any surface follow the same path: request, permission, risk classification, approval policy, domain tool, postcondition verification, audit and event. New products attach as tools and facts; they do not get their own approval or audit system.</p>
      </Panel>
      <OsModuleBridge config={getAutomateModuleDestinations()} />
    </OsPage>
  );
}
