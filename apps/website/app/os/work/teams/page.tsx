import Link from "next/link";
import { OsModuleBridge } from "@/components/os/OsModuleBridge";
import { LinkButton, OsPage, Panel } from "@/components/os/company/ui";
import { getWorkTeamsDestinations } from "@/lib/os-module-destinations";

export default function OsWorkTeamsPage() {
  return (
    <OsPage title="Teams" eyebrow="Work" summary="Team skills, capacity and utilisation live in People." actions={<LinkButton href="/os/people">Open People</LinkButton>}>
      <Panel title="Where to look">
        <p className="text-sm text-gray-700">
          Capacity and skills feed the explainable allocation recommendations in <Link className="font-semibold underline" href="/os/work">Work</Link>.
          Learning progress is in <Link className="font-semibold underline" href="/os/academy">Academy</Link>.
        </p>
      </Panel>
      <OsModuleBridge config={getWorkTeamsDestinations()} />
    </OsPage>
  );
}
