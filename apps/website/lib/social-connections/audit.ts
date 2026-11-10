/**
 * Social audit log writer — SERVER ONLY.
 * Writes entries to social_audit_logs (not the main audit_logs table,
 * which is reserved for platform-wide ops).
 */

export type SocialAuditAction =
  | "social.connection.created"
  | "social.connection.disconnected"
  | "social.connection.reconnected"
  | "social.credential.rotated"
  | "social.publish.submitted"
  | "social.publish.approved"
  | "social.publish.rejected"
  | "social.publish.cancelled"
  | "social.publish.published"
  | "social.publish.failed"
  | "social.webhook.received";

export type SocialAuditEntry = {
  organizationId: string;
  actorType: "user" | "ai" | "system";
  actorId?: string;
  action: SocialAuditAction;
  entity?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
};

export async function writeSocialAuditLog(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  entry: SocialAuditEntry
): Promise<void> {
  try {
    await supabase.from("social_audit_logs").insert({
      organization_id: entry.organizationId,
      actor_type: entry.actorType,
      actor_id: entry.actorId ?? null,
      action: entry.action,
      entity: entry.entity ?? null,
      entity_id: entry.entityId ?? null,
      metadata: entry.metadata ?? null,
      ip: entry.ip ?? null,
      user_agent: entry.userAgent ?? null,
    });
  } catch {
    // Audit log failure must never surface to callers
  }
}
