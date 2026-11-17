# DMS · Vehicle & Parts Inventory — v1 design & discussion

> Status: **DISCUSSION / not built yet.** This captures DMSJoy's "Vehicle &
> Parts Inventory" module in detail, maps it to what nexterp already has, and
> proposes a scoped first version. We decide scope here before writing code.
>
> Source: https://www.dmsjoy.com/products (Vehicle & Parts Inventory section).
> UI reference screenshot: _pending (to be attached)._

---

## 1. What DMSJoy's module is (literal)

Intro: _"DMSJoy Inventory tracks every vehicle and spare part across your entire
dealer network — from OEM warehouse to customer delivery — with native VIN,
motor number, and battery serial number tracking."_

### Capabilities
| # | Capability | What it means |
|---|------------|---------------|
| 1 | **Full Vehicle Lifecycle Tracking** | Track vehicles across warehouses, transit, showrooms, and customer delivery. Real-time location + status of every unit. |
| 2 | **VIN + Motor + Battery Identification** | Capture & track all three serials per unit. |
| 3 | **PDI (Pre-Delivery Inspection)** | Digital checklist completed before handover. |
| 4 | **FIFO Allocation** | Oldest received unit is allocated/shipped to a dealer first; end-to-end tracking. |
| 5 | **Spare Parts Management** | Parts inventory + catalog (barcode/QR scan). |
| 6 | **Accessories Catalog** | Catalogued accessories. |
| + | **Goods Receipt Verification** | Mobile barcode/QR scan when receiving stock. |

### "How it works" (the vehicle lifecycle)
1. **Vehicle received at warehouse** — all identifiers (VIN, motor, battery serials) captured.
2. **Allocated via FIFO** — shipped to dealer with end-to-end tracking.
3. **Dealer: PDI → showroom → delivery** — digital checklists and customer handover.

So the module is really **two things**:
- **(A) Vehicle lifecycle** — a unit moving OEM warehouse → (allocate) → transit → dealer → PDI → delivered, with a location/status trail.
- **(B) Parts & accessories** — standard inventory with a catalog + scanning.

---

## 2. What nexterp already has (reuse)

| Need | Already in nexterp |
|------|--------------------|
| Vehicle master w/ **VIN, motor serial, battery serial**, SoH, rates, photo | ✅ `Vehicle` (modules/dms/vehicles) |
| Dealer network nodes | ✅ `Dealer`, vehicle→dealer allocation (`dealerId`) |
| Vehicle → warehouse location | ✅ `Vehicle.warehouseId` (→ core Warehouse) |
| Flat status | ✅ `VehicleStatus` enum: `IN_STOCK · ALLOCATED · DELIVERED · IN_SERVICE` |
| **Spare parts / accessories inventory** | ✅ core ERP — `Item` + `Bin` + stock ledger; **goods receipt = Purchase Receipt** already exists |
| Vehicle history (service/warranty/subsidy) | ✅ `getVehicleRelated` on the detail |

**Takeaway:** identifier capture and parts inventory are basically already done
(items + purchase receipts). The real gap is the **lifecycle: allocation →
transit → PDI → delivery**, with a movement trail.

---

## 3. Gap analysis (what's missing for this module)

1. **Granular lifecycle + movement trail.** Today `status` is a flat enum with no
   history. DMSJoy tracks *location + stage over time*. → need a lifecycle stage
   and an **event log** (who/when/where).
2. **FIFO allocation workflow.** We store `dealerId` but have no *action* to
   allocate (oldest-first) + dispatch + confirm receipt at the dealer.
3. **Transit tracking.** No "in transit" state between warehouse and dealer.
4. **PDI.** No pre-delivery inspection checklist gating handover.
5. **Delivery / customer handover.** No delivery step that records the buyer +
   date and closes the lifecycle.
6. **Network status view.** We have a flat vehicles list; no "by stage / by
   location" rollup across the network.
7. _(Platform, defer)_ **Barcode/QR scanning + mobile** — a cross-cutting
   capability, not part of this first version.

---

## 4. Proposed first version (v1)

Make the **Vehicle a proper lifecycle object** and reuse existing inventory for
parts. Concretely:

### 4a. Lifecycle stages
Replace/extend the flat status with an explicit stage:

```
AT_WAREHOUSE  →  ALLOCATED  →  IN_TRANSIT  →  AT_DEALER  →  PDI_DONE  →  DELIVERED
                                                                         (+ IN_SERVICE, from workshop)
```
- `AT_WAREHOUSE` — received into an OEM/central warehouse (today's `IN_STOCK`).
- `ALLOCATED` — assigned to a dealer (FIFO suggestion).
- `IN_TRANSIT` — dispatched, not yet received at dealer.
- `AT_DEALER` — received at the dealer showroom.
- `PDI_DONE` — pre-delivery inspection passed.
- `DELIVERED` — handed to the customer.

### 4b. Movement/event trail
New `VehicleEvent` (timeline): `{ vehicleId, stage, note, dealerId?, warehouseId?, at (ts), byUser }`.
Every transition writes one row → a **timeline on the vehicle detail**.

### 4c. Workflow actions (on the vehicle detail)
- **Receive** (create) → `AT_WAREHOUSE` + event.
- **Allocate to dealer** → pick dealer; list suggests **oldest-received, unallocated first (FIFO)** → `ALLOCATED` + event.
- **Dispatch** → `IN_TRANSIT` + event.
- **Receive at dealer** → `AT_DEALER` + event.
- **PDI** → run a checklist (standard items, pass/fail + inspector + date); all-pass → `PDI_DONE`.
- **Deliver** → capture customer (name, or link a core `Customer`) + date → `DELIVERED`.

### 4d. PDI checklist (v1 = fixed standard list)
e.g. Battery SoH check · Motor/controller test · Lights & indicators · Brakes ·
Tyres · Charger & cable · Bodywork/paint · Documents. Each item pass/fail +
optional note; store as a `VehicleInspection` (+ items) linked to the vehicle.
(Configurable templates = later.)

### 4e. Network view
Add stage/location filters + a small "by stage" count strip to the vehicles
list (or a dashboard card): how many AT_WAREHOUSE / IN_TRANSIT / AT_DEALER / etc.

### 4f. Parts & accessories (reuse, minimal)
- Spare parts & accessories = existing **Items**; goods receipt = existing
  **Purchase Receipt**. v1 adds just an **"Accessory" item group/flag** + a
  filtered catalog view. No new engine.

### Out of v1 (explicitly)
- Barcode/QR scanning + mobile apps (platform-level).
- Configurable PDI templates.
- Multi-leg transit / carrier tracking.

---

## 5. Data model sketch (for when we build)
```
Vehicle            + lifecycleStage (enum)           // or repurpose status
                   + receivedAt, deliveredAt, customerName/customerId?
VehicleEvent       id, vehicleId, stage, note, dealerId?, warehouseId?, at, byUser
VehicleInspection  id, vehicleId, inspector, date, result (PASS/FAIL), note
VehicleInspItem    id, inspectionId, label, ok (bool), note
Item               + isAccessory (or itemGroup = "Accessory")
```
Clean-boundary rule stays: DMS references core `Warehouse`/`Customer`/`Item` by
id; core stays unaware.

---

## 6. Open questions (decide before building)
1. **Scope:** v1 = vehicle **lifecycle + allocation + PDI + delivery**, and reuse
   ERP inventory for spare parts/accessories? (Recommended.) Or also build a
   dedicated parts/accessories module now?
2. **Lifecycle shape:** explicit `lifecycleStage` enum **+ event-log timeline**
   (recommended) vs just more statuses with no history?
3. **PDI:** fixed standard checklist for v1 (recommended) vs configurable
   templates now?
4. **FIFO:** "suggest oldest-first, confirm manually" (recommended) vs
   auto-allocate?
5. **Customer on delivery:** reuse the core `Customer` record, or just capture a
   name string in v1?
6. **Scanning/mobile:** confirm it's deferred for v1.
```
