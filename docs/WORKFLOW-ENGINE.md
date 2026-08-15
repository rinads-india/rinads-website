# Workflow Engine

Event-driven multi-step orchestration in `@rinads/runtime`.

## Concepts

| Entity | Description |
|--------|-------------|
| `WorkflowDefinition` | Named template with trigger + ordered steps |
| `WorkflowExecution` | One run instance for a tenant |
| `WorkflowStepRun` | Per-step status, attempts, output |

Execution statuses: `queued`, `running`, `waiting`, `completed`, `failed`, `cancelled`, `dead_letter`.

Step statuses: `pending`, `running`, `completed`, `failed`, `skipped`, `waiting_approval`.

## Database tables

Migration `20260818100000_runtime_2.sql`:

- `workflows`, `workflow_versions`, `workflow_triggers`, `workflow_steps` — declarative definitions
- `workflow_executions` — run records with `correlation_id`, `trigger_event_id`, `input_payload`
- `workflow_step_runs` — step attempts linked to `execution_id`

**Note:** Runtime code currently uses in-memory `BUILTIN_WORKFLOWS`; DB rows are seeded for Ambady but not loaded at runtime yet.

## Builtin: order-fulfilment-v1

Defined in `packages/runtime/src/workflow/types.ts`:

| Step | Action |
|------|--------|
| `create_fulfilment` | `fulfilment.create_from_order` |
| `notify_customer` | `notification.enqueue` |

Trigger: `order.paid.v1`.

Started by `RuntimeService.handleOrderPaid()` → `triggerWorkflowsForEvent()` → `workflow_runner` job.

## Execution flow

1. `startWorkflow()` creates execution + pending step runs.
2. `runWorkflowExecution()` walks steps sequentially.
3. Each step calls `executeAction()` from the action registry.
4. Steps at or above approval risk threshold pause with `waiting_approval`.
5. Owner approves → `approveWorkflowStep()` → job re-enqueued.

Idempotency per step: `{correlationId}:{stepKey}`.

## Secondary builtin: low-stock-task-v1

Trigger: `inventory.low_stock.v1` · Step: `task.create`.

Not yet wired to event emitters; scheduler uses direct processor jobs instead.

## API surface

```typescript
runtime.listExecutions(organizationId);
runtime.getExecution(executionId);
runtime.getDashboard(organizationId).executions; // counts by status
```

Owner-portal: `/runtime`, `/runtime/executions/[id]`.

## Tests

`packages/runtime/tests/workflow.test.ts` — end-to-end `order.paid` flow and approval gate.
