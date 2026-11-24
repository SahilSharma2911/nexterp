# Seeka Motor — Documentation

EV Dealer Management System. Start here.

## For new engineers (read in order)
1. **[High-Level Design (HLD)](./hld.md)** — what it is, tech stack, architecture,
   domain map, core engines, auth, deployment, principles.
2. **[Low-Level Design (LLD)](./lld.md)** — repo layout, the module pattern, layer
   contracts, engine internals, UI building blocks, and how-to recipes (add a
   field / module, DB workflow, testing).
3. **[Architecture & flow](./architecture-flow.md)** — the end-to-end business
   flow (sale → service → aftersales) with diagrams.

## Deep dives
- **[Stock ledger](./stock-ledger.md)** — moving-average valuation engine.
- **[Barcode, lifecycle, batch & serial](./barcode-batch-tracking.md)** —
  traceability: VIN scan-to-advance, batch (FEFO), serial, labels.

## DMS verticals
- **[Warranty management](./dms/warranty-management.md)** — registration at sale,
  eligibility, OEM claim tracking, reimbursement reconciliation, recalls.
- **[Service & workshop](./dms/service-workshop.md)**
- **[Vehicle parts & inventory](./dms/vehicle-parts-inventory.md)**
- **[Network management](./dms/network-management.md)**
- **[Analytics & compliance](./dms/analytics-compliance.md)**

> Docs marked _"discussion / not built yet"_ are design notes; HLD, LLD,
> architecture-flow, stock-ledger, barcode and warranty-management reflect the
> shipped system.
