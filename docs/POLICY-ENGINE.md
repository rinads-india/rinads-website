# Policy Engine

Tenant-scoped configuration stored as versioned JSONB policies.

## tenant_policies table

| Column | Purpose |
|--------|---------|
| `policy_key` | Stable identifier |
| `policy_value` | JSONB config body |
| `version` | Monotonic version per key |
| `is_active` | Active flag |
| `organization_id` | Tenant scope |

Unique: `(organization_id, policy_key, version)`.

RLS: `tenant_policies_member_select` for org members.

## Seeded policies

`RuntimeService.initOrganization()` creates if missing:

```json
{
  "policy_key": "refund_approval_threshold_inr",
  "policy_value": { "amount": 5000 },
  "version": 1
}
```

## Read API

```typescript
getPolicyValue(policies, organizationId, policyKey);
refundRequiresApproval(policies, organizationId, amountInr);
```

Returns latest version by sorting `version` descending.

## Usage today

| Policy key | Consumer | Behavior |
|------------|----------|----------|
| `refund_approval_threshold_inr` | `refundRequiresApproval()` | Amounts above threshold need approval |

Workflow approval threshold (`approvalRiskThreshold: "HIGH"`) is code-configured on `RuntimeService`, not yet stored in `tenant_policies`.

## Supabase sync

Worker sync upserts active policies via `syncRuntimeArtifactsToSupabase()`. No admin UI for policy editing yet.

## Future extensions

Migration schema supports additional keys without code changes:

- Auto-approval risk overrides
- Notification channel preferences
- Workflow enable/disable per tenant

DB-driven policy loading on worker boot is **deferred** — policies live in memory until sync.

## Related

- [APPROVAL-ENGINE.md](./APPROVAL-ENGINE.md)
- [ACTION-REGISTRY.md](./ACTION-REGISTRY.md)
