# Action Registry

Typed, permission-aware side effects invoked by workflow steps and (future) direct runtime calls.

## registerAction

`packages/runtime/src/actions/registry.ts`:

```typescript
registerAction({
  key: "fulfilment.create_from_order",
  description: "Create fulfilment from paid order",
  riskLevel: "MEDIUM",
  idempotencyRequired: true,
  moduleKey: "fulfilment",
  requiredPermission?: "org.manage",
  handler: async (ctx, input) => ({ ok: true, data: { ... } }),
});
```

Global `Map` registry. `getAction(key)`, `listActions()`, `clearActionRegistry()` (tests).

## Risk levels

| Level | Examples |
|-------|----------|
| `LOW` | `notification.enqueue`, `task.create`, `analytics.record` |
| `MEDIUM` | `fulfilment.create_from_order`, `order.update_status` |
| `HIGH` | (threshold default for workflow approval) |
| `CRITICAL` | `refund.process` (requires `org.manage`) |

`seedDefaultActionDefinitions()` documents built-in keys; handlers are registered in `runtime-wiring.ts`.

## Validation pipeline

`executeAction()` in `packages/runtime/src/actions/executor.ts`:

1. **Registration** — reject unregistered keys (`validation_error`)
2. **Permission** — check `requiredPermission` against `ctx.permissions` (`authorization_error`)
3. **Tenant** — require `organizationId` (`tenant_error`)
4. **Handler** — invoke registered handler

Workflow engine calls `requiresApproval(riskLevel, approvalRiskThreshold)` before execution. Default threshold: `HIGH`.

## Wired handlers (operations-server)

| Action | Handler behavior |
|--------|------------------|
| `fulfilment.create_from_order` | `FulfilmentService.createForOrder` |
| `notification.enqueue` | `runtime.enqueueNotification()` |
| `task.create` | `TaskService.create` |
| `analytics.record` | No-op success |

`refund.process` is defined in seed metadata but **not registered** in wiring yet.

## ActionContext

```typescript
{
  organizationId: string;
  userId?: string;
  roleKey?: string;
  permissions?: string[];
  correlationId?: string;
}
```

Passed from `processQueue()` / worker with role and permissions for authorization.

## Tests

`packages/runtime/tests/actions.test.ts` — unregistered block, permission enforcement, approval threshold.
