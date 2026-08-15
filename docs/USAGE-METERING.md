# Usage Metering

Plan limits enforced via `usage_counters` and `@rinads/billing` helpers.

## Metrics

| Key | Enforced when |
|-----|----------------|
| `orders/month` | Checkout / order.placed |
| `seats` | Member invite accept |

## Limits (defaults)

| Plan | orders/month | seats |
|------|--------------|-------|
| starter | 100 | 5 |
| growth | 1000 | 25 |
| platform | 10000 | 100 |

## Tenancy

`requirePlanModule(tenancy, moduleKey)` combines plan modules + feature flags.

Over-limit checkout returns upgrade CTA (owner portal `/settings/billing`).
