# nexterp — Stock, modeled on ERPNext

`nexterp` is a **generic ERP** whose data model and logic are ported from
**ERPNext** (frappe/erpnext, GPL-3.0) into Next.js + Prisma + Postgres. We copy
ERPNext's *design*, not its code. Names mirror ERPNext DocTypes.

## The ledger model (why ERPNext's stock is correct)
- **Stock Ledger Entry (SLE)** — immutable, append-only. One row per stock change:
  `actualQty` (delta), `qtyAfterTransaction` (running balance), and valuation
  (`incomingRate`, `valuationRate`, `stockValue`, `stockValueDifference`). The SLE
  table **is** the source of truth.
- **Bin** — cached running balance per (item, warehouse): actual / reserved /
  ordered / planned / projected qty + valuation. `projected = actual + ordered +
  planned − reserved`.
- **Vouchers** (Stock Entry, later Delivery Note / Purchase Receipt / Work Order)
  are documents. On **submit** they post SLEs + update Bins; on **cancel** they
  post reversing SLEs. Submitted documents are immutable.

## Models (ERPNext → ours)
| ERPNext | nexterp |
|---|---|
| Item | `Item` |
| Warehouse | `Warehouse` |
| Stock Ledger Entry | `StockLedgerEntry` |
| Bin | `Bin` |
| Stock Entry + detail | `StockEntry` + `StockEntryDetail` |

## Valuation — moving average
```
receipt qty Q @ rate R into bin (bal, value V):
  value' = V + Q*R ;  bal' = bal + Q ;  rate' = value'/bal'
issue qty Q:                       (moving average rate unchanged)
  stockValueDifference = -Q*rate ; value' = V - Q*rate
```

## Posting engine — `lib/stock-ledger.ts`
`postStockLedger(tx, {...})` is the single choke-point (port of ERPNext
`make_sl_entries`): reads Bin → computes qtyAfter + valuation → negative-stock
guard → inserts immutable SLE → upserts Bin. Transfers post two entries (out +
in); Manufacture posts component issues + a finished-good receipt.

## Document lifecycle
`DRAFT → SUBMITTED → CANCELLED`. Only submit posts to the ledger; cancel reverses.
Amend = cancel + new.

## UI (ERPNext Desk style)
Left sidebar workspace + list views (filters/columns/New) + document form views
(sections + items child-table grid + Save → Submit → Cancel), plus reports
(Stock Ledger, Stock Balance).

## Roadmap
1. ✅ Foundation: schema (Item/Warehouse/SLE/Bin/StockEntry) + posting engine + shell.
2. Stock Entry (actions + UI) + Stock Ledger & Stock Balance reports.
3. Serial No / Batch on the ledger.
4. Manufacturing (BOM explosion + Work Order) posting Manufacture entries.
5. Selling / Buying (Delivery Note / Purchase Receipt) posting to the same ledger.
