# Approval Engine

Human-in-the-loop gate for high-risk workflow steps and policy-driven refunds.

## runtime_approvals table

Migration `20260818100000_runtime_2.sql`:

| Column | Purpose |
|--------|---------|
| `execution_id` / `step_run_id` | Workflow context |
| `action_key` | Gated action |
| `payload_hash` | Integrity fingerprint |
| `risk_level` | `LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL` |
| `status` | `pending`, `approved`, `rejected`, `expired` |
| `expires_at` | Default TTL 24h |
| `resolved_by` / `resolved_at` | Decision audit |

RLS: org members can SELECT and UPDATE (`runtime_approvals_member_select/update`).

## Workflow approval flow

When a step's action risk ≥ `approvalRiskThreshold` (default `HIGH`) and not yet approved:

1. Step → `waiting_approval`, execution → `waiting`
2. `createApprovalRequest()` records pending approval
3. Owner approves via `/approvals` → `RuntimeService.approve()`
4. `approveWorkflowStep()` resets step to `pending`, re-enqueues `workflow_runner`

Reject leaves execution in `waiting` without resume.

## tenant_policies: refund threshold

`RuntimeService.initOrganization()` seeds:

```json
{
  "policy_key": "refund_approval_threshold_inr",
  "policy_value": { "amount": 5000 }
}
```

`refundRequiresApproval(policies, orgId, amountInr)` returns true when amount exceeds threshold. Used by future refund flows; not yet wired to `refund.process` action.

## API

```typescript
runtime.listApprovals(organizationId);
runtime.approve(approvalId, resolvedBy);
runtime.reject(approvalId, resolvedBy);
```

`expireStaleApprovals()` runs on list — pending past `expires_at` → `expired`.

## Owner portal

- `apps/owner-portal/app/approvals/page.tsx` — queue UI
- `apps/owner-portal/app/approvals/actions.ts` — server actions calling `approve()` / `reject()`, then `processQueue()`

## Tests

`packages/runtime/tests/workflow.test.ts` — HIGH-risk step waits, approve resumes to `completed`.
