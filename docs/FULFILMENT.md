# Fulfilment

Order payment triggers runtime event `order.paid` → fulfilment record + pick list.

Statuses: `pending → picking → picked → packing → packed → completed`

Pick lists grouped by location/SKU. Packing creates `PackageRecord`.

Owner UI: `/fulfilment`, mobile `/fulfilment/pick`, `/fulfilment/pack`
