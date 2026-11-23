# Barcode, Vehicle Lifecycle, Batch & Serial Tracking

_Seeka Motor — Service & Stock traceability_

This note explains the traceability capabilities added to the system and how they
fit the dealership: **scanning a vehicle to move it through its lifecycle**, and
**tracking items by batch/lot (with expiry) or by serial number** — received,
issued and reversed through the real stock flows. All of it is built on one simple
idea — a barcode answers _"which exact thing is this?"_

---

## 1. The core idea

A barcode is just a machine-readable label. The only question is **how specific**
the thing it identifies is:

| Barcode on… | Identifies | Example |
|---|---|---|
| An **item** | a product _type_ | "Brake pad SP-001" |
| A **batch** | a _lot_ (+ its expiry) | "Coolant, lot B-2026-07, exp Dec-2027" |
| A **serial** | one _individual unit_ | one specific battery pack |
| A **vehicle (VIN)** | one _individual car_ | chassis MH12-AB-1234 |

👉 A **vehicle is simply a "serialised item"** where the VIN is the serial. That
is why scanning a car to change its status works so naturally.

### Everything is always scannable (no blank barcodes)

Every detail page renders a **scannable Code128** — you never see an empty
barcode. If no custom barcode was typed in, it **falls back to the thing's own
natural code**, which always exists and is unique:

| Page | Shows barcode of | Falls back to |
|---|---|---|
| **Item** | the item's `barcode` field | its **Item Code** (SKU) |
| **Vehicle** | — | its **VIN** |
| **Batch** | the batch's `barcode` field | its **batch number** |

So an item created without a barcode (common) still shows a scannable barcode
built from its item code, with a caption saying so. Typing a custom barcode on
the item (e.g. the manufacturer's EAN/UPC) overrides the fallback.

---

## 2. Vehicle scan → lifecycle

### What it does

Every vehicle moves through a fixed lifecycle:

```
IN STOCK → ALLOCATED → IN TRANSIT → AT DEALER → PDI DONE → DELIVERED
```

Each step is a checkpoint in the real world (warehouse gate, transporter, dealer
receiving, pre-delivery inspection, hand-over to the customer). Instead of
finding the car in a long list, staff **scan the car** at each checkpoint and the
system moves it to the next stage — and logs who/when for the audit trail.

### Where to use it

**Vehicles page → "Scan a vehicle" panel** (top of the page).

1. Scan the VIN barcode (or type it) and press Enter / Find.
2. The system shows the car, its photo, and its **current stage**.
3. It offers the **next step**:
   - **One-click** for simple moves: _Dispatch_ (→ in transit) and _Receive at
     dealer_ (→ at dealer). Scan, tap, done.
   - **Opens the vehicle** for steps that need extra details: _Allocate_ (needs a
     dealer), _Run PDI_ (needs the inspection checklist), _Deliver_ (needs the
     customer).

### Why some steps are one-click and others aren't

Allocation, PDI and delivery capture real information (which dealer, inspection
results, which customer). Those can't be a blind one-tap — so the scan takes you
straight to the right screen with the car already loaded. Dispatch and receive
carry no extra data, so they advance instantly.

### What it gives management

- Faster, error-free checkpoints — no hunting for the right record.
- A complete, timestamped lifecycle history per vehicle (already recorded as
  events).
- The same model works at every physical station.

---

## 3. Item tracking: batch/lot vs serial

Each item can be tracked in one of three ways (set when creating the item):

### a) By quantity only _(default)_
Just "50 brake pads in stock." Units are interchangeable; no individual
identity. One barcode = the product type.

### b) By **batch / lot** — _"moves in lots, with expiry"_
A **batch is a group** of identical units made/received together, sharing **one
lot number, one expiry date, and one barcode**.

- Example: _Coolant — lot B-2026-07, 100 bottles, expires Dec 2027._
- **One barcode for the whole lot** (all 100 bottles share it). A _new_ batch
  gets a _new_ barcode.
- Use it when you care about **shelf life / recalls** — fluids, battery cells,
  tyres, adhesives.

> ❗️Common confusion: batch tracking does **not** mean one barcode per bottle.
> One barcode per **lot**. One-barcode-per-unit is _serial_ tracking (below).

### c) By **serial** — each unit is unique
Each individual unit has its own serial number and its own barcode (e.g. every
battery pack, motor, controller). 100 units = 100 barcodes. Use for high-value,
individually-warrantied parts.

### Where to use batches

**Stock → Batches** (page in the sidebar).

- **Scan a batch:** scan a barcode or lot number to jump straight to the lot.
- **Top cards:** total batches, expiring soon, expired, units tracked (live
  on-hand).
- **Expiring soon list:** batches within 90 days of expiry — your action list.
- **Table:** every batch with its item, **On hand** (live) vs **Received**, expiry
  date, and a colour-coded shelf-life badge (🟢 Fresh · 🟡 Expiring soon ·
  🔴 Expired). Filter by status.
- **New Batch:** record the item, lot number, barcode, mfg/expiry dates, quantity,
  supplier — and **"Receive into warehouse"**, which posts the quantity into stock
  as a real receipt attributed to that lot.
- **Batch detail:** everything above plus a **printable barcode** for the lot.
- **Labels:** print a sheet of batch barcode labels (Batches → Labels).
- An item's own page shows all its batches with live on-hand and a "New batch"
  shortcut.

### Where to use serials

**Stock → Serial Numbers** (page in the sidebar).

- **Scan a serial:** scan a barcode or serial number to pull up the exact unit.
- **Top cards:** total units, in-stock, delivered, scrapped.
- **Table:** every unit with its item, warehouse and status (In stock · Delivered
  · Scrapped); filter by status.
- **New Serial / detail:** register a unit, set its status, and print its barcode.
- An item's own page lists its serials (when serial-tracked).

### Batches & serials are real stock now (not just lists)

Both are wired into actual inventory movements — valuation is untouched (still
moving-average at the item level); batches and serials add *identity + quantity
traceability* on top.

**Batches (FEFO — first-expiry-first-out):**
- **Receiving** a lot — via **New Batch** (with a warehouse) *or* a **Stock Entry
  / Purchase Receipt** line (enter the batch no + expiry) — posts a real receipt
  attributed to that lot. On-hand is read **live from the ledger**, so it can
  never drift.
- **Issuing** a batch-tracked item — **Job Card**, **Delivery Note**, or **Stock
  Entry** (issue / transfer / manufacture) — consumes the **nearest-expiry lot
  first**, automatically, across multiple lots if needed. A material transfer
  moves each lot intact into the destination warehouse.
- **Cancelling** credits the exact same lots back.
- A lot that has stock movements can't be deleted (ledger integrity).

**Serials (one record per physical unit):**
- **Receiving** a serialised item on a **Stock Entry / Purchase Receipt** line —
  paste the serial numbers (one per line). The count is validated against the
  quantity, duplicates are rejected, and the units are registered **In stock**.
- **Issuing** a serialised item — **Job Card**, **Delivery Note**, or **Stock
  Entry issue** — auto-picks the **oldest in-stock units**, marks them
  **Delivered**, and remembers the voucher.
- **Cancelling** an issue returns those exact units to stock; cancelling a
  receipt removes the units it created.

---

## 4. What is live now vs. next

**Live now**
- Vehicle scan-to-advance on the Vehicles page.
- **Batch tracking** as real inventory: receive via the Batches page *or* Stock
  Entry / Purchase Receipt lines; live on-hand from the ledger; expiry dashboard;
  per-batch barcodes + printable label sheets; scan lookup; item-level view.
- **FEFO issue** across **every issue flow** — job cards, delivery notes, and
  stock entries (issue / transfer / manufacture); cancels restore the exact lots.
- **Serial tracking** as real inventory: a serial registry with scan lookup;
  capture-on-receipt (paste list, validated) on Stock Entry / Purchase Receipt;
  auto-consume-on-issue (oldest first → Delivered) on job cards, delivery notes
  and stock entries; cancels restore.

**Sensible next steps (not yet done)**
- **Serial movement on transfers / manufacture** — serials aren't yet moved
  between warehouses on a stock transfer, nor consumed as manufacture inputs
  (batches already are).
- **Item & VIN label sheets** — printable label pages beyond batches.
- **Work Orders** aren't yet batch/serial-aware.

The same FEFO / serial engines (`lib/batch-stock.ts`, `lib/serial-stock.ts`) are
reused everywhere, so bringing in a remaining flow is a small, consistent change.

---

## 5. One-line summary for the team

> **Scan a car → it advances its lifecycle. Scan a batch or serial → you know the
> exact lot (and its expiry) or the exact unit.** Receiving records them, issuing
> consumes them FEFO/oldest-first, and cancelling puts them back — same idea at
> every level: product, lot, unit, or vehicle.
