# Purchase Orders

Statuses: `draft → submitted → approved → ordered → partially_received → received → cancelled → closed`

Partial receiving keeps PO in `partially_received` until all lines fully received.

Document numbers via centralized `DocumentService` / `document_sequences`.

Owner UI: `/procurement/purchase-orders`
