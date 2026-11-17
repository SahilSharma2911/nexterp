# DMS · Warranty Management — v1 design & discussion

> Status: **DISCUSSION / not built yet.** Captures DMSJoy's "Warranty
> Management" module and maps it to nexterp's **already-built** Warranty module
> (registrations + claims). This is the most complete DMS area we have, so v1 is
> mostly **enhancements**, not greenfield.
>
> Source: https://www.dmsjoy.com/products (Warranty Management). UI reference:
> `tab-1.png` _(pending — not yet attached)._

---

## 1. What DMSJoy's module is (literal)

Intro: _"…tracks warranties from point-of-sale registration through the complete
lifecycle — including multi-year EV battery warranties with State of Health
monitoring — and manages the full claim-to-reimbursement workflow."_

| # | Capability | Detail (quoted) |
|---|------------|------------------|
| 1 | **Registration at Sale** | "Warranty terms **auto-activated at vehicle delivery**." Component-level: "**bumper-to-bumper, powertrain, battery, motor, corrosion — each with independent terms**." |
| 2 | **Automated Eligibility Check** | "Warranty eligibility **auto-checked from job card**." Real-time, triggered by the service event. |
| 3 | **Claim Creation & Documentation** | "Claim created & submitted." "**Job card data flows directly into the OEM portal.**" Claim form with job-card attachment. |
| 4 | **OEM Submission & Tracking** | "OEM approves." Submission + approval visibility. |
| 5 | **Reimbursement Reconciliation** | "Reimbursement **tracked end-to-end and reconciled**." |
| 6 | **Warranty Analytics** | Dashboard of claims/warranties (not detailed on the page). |
| EV | **Multi-year battery warranty + SoH monitoring** | SoH **monitored over time**; threshold-based eligibility. |

---

## 2. What nexterp already has (we built this) ✅

- **Warranty registration** per vehicle, **component-level** (VEHICLE / BATTERY /
  MOTOR / CONTROLLER / CHARGER), with coverage period, km limit, **battery SoH
  threshold**, ACTIVE/VOID; computes expiry / active / days-left.
- **Warranty claim** doc: `DRAFT → SUBMITTED → APPROVED / REJECTED → SETTLED`
  (+ CANCELLED), can link a **job card** (`jobCardId`), stores claimAmount,
  approvedAmount, oemRef.
- **Automated eligibility at submit** — checks coverage period, km limit, and
  (battery) whether SoH dropped **below** the threshold; stores verdict + note,
  shown as a banner.
- Fully tested (eligibility unit tests + workflow/guards).

So capabilities **#2 (eligibility)**, **#4 (OEM submission/tracking)**, and the
component + SoH-threshold model are **done**. The rest are gaps/polish.

---

## 3. Gap analysis (DMSJoy vs us)

| Area | DMSJoy | nexterp today | Gap |
|------|--------|---------------|-----|
| Register **at sale** | auto-activate at delivery | manual registration | **Missing auto-activation** |
| **Standard terms / templates** | preset component terms (bumper-to-bumper, powertrain, corrosion…) | each warranty entered by hand | **Missing templates** |
| Eligibility **from the job card** | auto-checked when servicing | computed at claim submit | Partial (no "from job card" entry) |
| **Claim from job card** | job-card data flows into claim | `jobCardId` exists but form doesn't prefill | **Missing prefill/flow** |
| Claim **documentation** | attach docs/photos | none on warranty claim | **Missing attachments** |
| **Reimbursement reconciliation** | claimed vs approved vs **received**, reconciled | approvedAmount + SETTLED status | **Missing received amount + reconcile** |
| **Analytics** | dashboard | none | **Missing** |
| **SoH monitoring over time** | readings tracked, trend | single `batterySoH` on vehicle | **Missing history** |

---

## 4. Proposed first version (v1) — enhancements

### 4a. Warranty policy templates + register-at-sale
- **WarrantyPolicy** template: a named set of component terms (e.g. "Standard EV"
  = Vehicle 36mo, Battery 96mo @ SoH 70%, Motor 60mo). Optionally per vehicle
  model.
- **Apply at delivery:** when a vehicle is delivered (ties to the Vehicle
  lifecycle v1) — or via a **"Register standard warranty"** button on the vehicle
  — auto-create the component warranties from the chosen policy.

### 4b. Claim-from-job-card flow
- On a **Job Card**, show the vehicle's **active warranties + live eligibility**;
  a **"Raise warranty claim"** button prefills the claim (vehicle, job card,
  suggested warranty, parts/labour as the claimed amount).
- (We already store `jobCardId`; this wires the entry point + prefill.)

### 4c. Claim documentation
- Add **attachments** to a warranty claim (`photos[]` / docs) reusing the upload
  component — the "documentation" in capability #3.

### 4d. Reimbursement reconciliation
- Add `receivedAmount` + a **"Record reimbursement"** step on SETTLE; show a small
  reconcile line: **claimed → approved → received**, with variance flagged.

### 4e. Warranty analytics (dashboard/report)
- Claims by **status**, **approval rate**, totals **claimed vs approved vs
  received**, **warranties expiring soon**, claims **by component**.

### 4f. (Optional, discuss) SoH monitoring over time
- **VehicleSoHReading** `{ vehicleId, soH, readAt, source }` → a **trend** on the
  vehicle; eligibility uses the **latest** reading instead of the single field.

### Out of v1
- Real OEM portal API integration (we model submission/tracking internally).
- Notifications.

---

## 5. Data model sketch
```
WarrantyPolicy      id, name, model?, active
WarrantyPolicyLine  id, policyId, component, months, kmLimit?, soHThreshold?
Warranty            (+ policyId?)                    // which template produced it
WarrantyClaim       + receivedAmount?, reconciledAt?, photos[]
VehicleSoHReading   id, vehicleId, soH, readAt, source   // optional (4f)
```
Clean-boundary rule stays (reference core entities by id).

---

## 6. Open questions (decide before building)
1. **Scope:** v1 = **templates + register-at-sale + claim-from-job-card +
   attachments + reconciliation + analytics**? Include **SoH-over-time** (4f) now
   or defer?
2. **Register-at-sale trigger:** auto-create on the lifecycle **Delivered** step
   (needs the Vehicle-lifecycle v1 first), or a manual **"Register standard
   warranty"** button for now? (Recommended: button now, auto later.)
3. **Templates:** global standard policies, or **per vehicle model**? (Recommended:
   global for v1, model-scoped later.)
4. **Reconciliation:** just add `receivedAmount` + variance (recommended) vs a
   full payments-style ledger?
5. **Analytics:** a dedicated Warranty dashboard page, or cards on the main
   dashboard?
6. Confirm **OEM portal API** + notifications are deferred.
```
