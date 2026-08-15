# Goods Receipts

Goods receipts record inbound inventory from purchase orders.

Each line captures: received, accepted, damaged, short quantities + batch reference + inspection notes.

Accepted quantity creates `purchase` stock movements. Damaged quantity may create `damage` movements.

Owner UI: `/procurement/receipts`
