export type FirstValueEventSource = "system" | "connector" | "user" | "rinpo";

export type FirstValueDefinition = {
  productKey: string;
  eventKey: string;
  version: string;
  description: string;
  requiredProperties?: readonly string[];
};

export type FirstValueEvent = {
  organizationId: string;
  productKey: string;
  eventKey: string;
  definitionVersion: string;
  occurredAt: string;
  source: FirstValueEventSource;
  idempotencyKey: string;
  properties: Readonly<Record<string, unknown>>;
};

export type FirstValueDecision =
  | { achieved: true; organizationId: string; productKey: string; eventKey: string }
  | {
      achieved: false;
      reason:
        | "tenant_missing"
        | "definition_mismatch"
        | "required_property_missing"
        | "event_time_invalid"
        | "idempotency_key_missing";
    };

/**
 * Deterministic, side-effect-free first-value evaluator. Persistence should
 * enforce uniqueness on the event idempotency key within the tenant scope.
 */
export function evaluateFirstValueEvent(
  event: FirstValueEvent,
  definition: FirstValueDefinition,
): FirstValueDecision {
  if (!event.organizationId.trim()) {
    return { achieved: false, reason: "tenant_missing" };
  }

  if (!event.idempotencyKey.trim()) {
    return { achieved: false, reason: "idempotency_key_missing" };
  }

  if (
    event.productKey !== definition.productKey ||
    event.eventKey !== definition.eventKey ||
    event.definitionVersion !== definition.version
  ) {
    return { achieved: false, reason: "definition_mismatch" };
  }

  if (Number.isNaN(Date.parse(event.occurredAt))) {
    return { achieved: false, reason: "event_time_invalid" };
  }

  for (const property of definition.requiredProperties ?? []) {
    const value = event.properties[property];
    if (value === undefined || value === null || value === "") {
      return { achieved: false, reason: "required_property_missing" };
    }
  }

  return {
    achieved: true,
    organizationId: event.organizationId,
    productKey: event.productKey,
    eventKey: event.eventKey,
  };
}
