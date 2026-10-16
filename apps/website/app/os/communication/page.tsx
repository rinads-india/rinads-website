import { can } from "@rinads/company-os";
import { loadCommDetail } from "@rinads/company-os-server";
import { OsRoomsContent } from "@/components/os/OsRoomsContent";
import { ActionForm } from "@/components/os/company/ActionForm";
import { guard } from "@/components/os/company/guard";
import { Badge, Empty, OsPage, Panel, SectionGate, Table } from "@/components/os/company/ui";
import { formatDateTime, titleCase } from "@/lib/company-os/format";
import { s, sn } from "@/lib/company-os/rows";

export const dynamic = "force-dynamic";
const CHANNELS = ["call", "voice", "whatsapp", "email", "sms", "web_chat", "meeting"];
const LINKS = ["lead", "company", "contact", "opportunity", "project", "ticket", "order", "invoice"];

export default async function CommunicationPage() {
  // Rooms (team chat) stays available to every member; the activity log needs comms.read.
  const g = await guard("/os/communication", null, "Communication");
  if (!g.ok) return g.block;
  const { session } = g.data;
  const canRead = can(session.ctx, "comms.read");
  const manage = can(session.ctx, "comms.manage");
  const detail = canRead ? await loadCommDetail(session.db, session.ctx) : null;

  return (
    <OsPage title="Communication" eyebrow="Conversations" summary="Calls, voice, WhatsApp, email, SMS and web chat logged against the lead, customer, project, ticket, order or invoice they belong to. Logging records what happened; it does not send anything.">
      {detail ? (
        <Panel id="activity" title="Activity">
          <SectionGate section={detail.activities} label="Communication">
            {(rows) => (
              <Table
                caption="Communication activity"
                rows={rows}
                empty={<Empty title="No activity logged" />}
                columns={[
                  { header: "When", cell: (r) => formatDateTime(s(r, "occurred_at")) },
                  { header: "Channel", cell: (r) => titleCase(s(r, "channel")) },
                  { header: "Direction", cell: (r) => titleCase(s(r, "direction")) },
                  { header: "Status", cell: (r) => <Badge tone={["failed", "missed"].includes(s(r, "status")) ? "bad" : "neutral"}>{titleCase(s(r, "status"))}</Badge> },
                  { header: "Subject", cell: (r) => sn(r, "subject") ?? sn(r, "summary") ?? "—" },
                  { header: "Linked to", cell: (r) => (sn(r, "linked_type") ? titleCase(s(r, "linked_type")) : "Not linked") },
                ]}
              />
            )}
          </SectionGate>
          {manage && (
            <div className="mt-4">
              <ActionForm
                actionKey="comm.log_activity"
                title="Log an interaction"
                submitLabel="Log"
                fields={[
                  { name: "channel", label: "Channel", kind: "select", required: true, options: CHANNELS.map((c) => ({ value: c, label: titleCase(c) })) },
                  { name: "direction", label: "Direction", kind: "select", required: true, options: [{ value: "inbound", label: "Inbound" }, { value: "outbound", label: "Outbound" }] },
                  { name: "status", label: "Outcome", kind: "select", options: ["logged", "delivered", "failed", "missed"].map((c) => ({ value: c, label: titleCase(c) })) },
                  { name: "subject", label: "Subject" },
                  { name: "summary", label: "Summary", kind: "textarea" },
                  { name: "linkedType", label: "Linked record type", kind: "select", options: LINKS.map((c) => ({ value: c, label: titleCase(c) })) },
                  { name: "linkedId", label: "Linked record id", help: "Both linked fields are required together; the record must exist in this organisation." },
                ]}
              />
            </div>
          )}
        </Panel>
      ) : (
        <Panel title="Activity log"><p className="text-sm text-gray-700">Your role does not include <code className="rounded bg-gray-100 px-1">comms.read</code>. Team rooms are below.</p></Panel>
      )}
      <OsRoomsContent />
    </OsPage>
  );
}
