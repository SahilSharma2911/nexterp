# Barcode, Vehicle Lifecycle & Batch Tracking

_Seeka Motor — Service & Stock traceability_

This note explains two capabilities added to the system and how they fit the
dealership: **scanning a vehicle to move it through its lifecycle**, and
**tracking items by batch/lot with expiry dates**. Both are built on one simple
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
- An item's own page shows all its batches with live on-hand and a "New batch"
  shortcut.

### Batches are real stock now (not just a list)

Batch tracking is wired into actual inventory:

- **Receiving a lot** (New Batch with a warehouse) posts a genuine stock receipt —
  the units become on-hand, attributed to that batch. **On-hand is always read
  live from the stock ledger** (received − issued), so it can never drift.
- **Issuing via a job card** consumes batch-tracked parts **FEFO
  (first-expiry-first-out)** — the nearest-expiry lot is drained first,
  automatically, across multiple lots if needed.
- **Cancelling a job** credits the exact same lots back.
- Valuation is unaffected — it stays moving-average at the item level; batches add
  *quantity traceability* on top.
- A lot that has stock movements can't be deleted (ledger integrity).

---

## 4. What is live now vs. next

**Live now**
- Vehicle scan-to-advance on the Vehicles page (reuses the existing lifecycle).
- Batch registry with **real stock**: receive a lot into a warehouse, live
  on-hand from the ledger, expiry dashboard, per-batch barcodes, scan lookup,
  item-level batch view.
- **FEFO issue** on job cards: batch-tracked parts are consumed earliest-expiry
  first; job cancellation restores the exact lots.

**Sensible next steps (not yet done)**
- Extend batch attribution + FEFO to the **generic stock flows** (Stock Entry,
  Delivery Note, Purchase Receipt) so every warehouse movement is lot-aware, not
  just job cards.
- A **serial-number registry** for serialised items (one record per physical
  unit), with capture on receipt and consumption on issue.
- **Barcode label sheets** — printable label pages for batch, item and VIN codes.

These are deliberate follow-ups: today's build makes batches real inventory for
the service (job-card) flow without disturbing the rest of the working stock
ledger. The same FEFO engine is reused as each flow is brought in.

---

## 5. One-line summary for the team

> **Scan a car → it advances its lifecycle. Scan or look up a batch → you know the
> lot and its expiry.** Same idea, different level of "how exact" — product, lot,
> unit, or vehicle.
