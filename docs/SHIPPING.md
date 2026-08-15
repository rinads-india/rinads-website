# Shipping

Shipments linked to packages via `CourierAdapter` interface.

`DemoCourierAdapter` provided for development. Production adapters implement: `createShipment`, `cancelShipment`, `trackShipment`, `getLabel`.

Delivery events normalized: `label_created`, `picked_up`, `in_transit`, `out_for_delivery`, `delivered`, `failed`, `returned`.

Owner UI: `/shipping`
