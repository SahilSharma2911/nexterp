# DMS · Service & Workshop — v1 design & discussion

> Status: **DISCUSSION / not built yet.** Captures DMSJoy's "Service & Workshop"
> module, maps it to nexterp's **existing Job Cards** module, and proposes a
> scoped first version.
>
> Source: https://www.dmsjoy.com/products (Service & Workshop / Service
> Management). UI reference: `slide-1.png … slide-5.png` _(pending — not yet
> attached)._

---

## 1. What DMSJoy's module is (literal)

Intro: _"DMSJoy Service Management digitizes the entire workshop workflow —
appointment scheduling, cost estimation, job card management, technician
assignment, quality checks, and invoicing."_

### Capabilities
| # | Capability | Detail (quoted) | EV-specific |
|---|------------|------------------|-------------|
| 1 | **Service Scheduling & Bay Allocation** | "Online booking, service bay calendar, technician-to-job matching, estimated completion time, customer notifications via WhatsApp/SMS/email" | **HV bay** designation + auto-match **HV-certified** technicians |
| 2 | **Cost Estimation** | "Itemized estimates with labor rate cards, live parts pricing, warranty vs paid classification. Digital customer approval via messaging or email" | **Battery diagnostic** estimate with warranty auto-check vs **SoH thresholds** |
| 3 | **Digital Job Cards** | "Create, assign, track, close job cards digitally. Parts consumption logging, technician time tracking, quality check workflow" | **OTA firmware** logging, **BMS** diagnostic attachment, **HV isolation test sign-off** |
| 4 | **Technician Management** | "Skill-based assignment, workload balancing, productivity tracking (actual vs estimated), certification tracking" | **HV certification validation** — only certified techs on HV work |
| 5 | **Service History** | "Complete vehicle service timeline accessible from any dealership. Previous job cards, parts used, technician notes" | — |
| 6 | **Quality Checks & Invoicing** | QC before invoice; final step of the flow | — |

### "How it works"
1. **Customer books** — bay + technician assigned automatically.
2. **Estimate → approval → job card** — customer approves digitally.
3. **Work completed → QC → invoice** — customer notified for pickup, **full audit trail**.

---

## 2. What nexterp already has (we built this)

The **Job Cards** module already covers the core of #3:
- Job Card doc: vehicle, **parts** (core Item + qty + rate), **labour** lines,
  technician (free text), odometer, **photos**, remarks.
- Workflow `OPEN → COMPLETED → CANCELLED`; on **Complete** it issues parts
  through the **stock ledger** and posts revenue to the **GL** (Debtors /
  Service Income); **Cancel** reverses both.
- **Service history** per vehicle (`getVehicleRelated`) on the vehicle detail.

So "digital job card + parts consumption + revenue" is done. The gaps are the
front half (booking, estimate, assignment) and the quality/EV rigor.

---

## 3. Gap analysis (DMSJoy vs us)

| Area | DMSJoy | nexterp today | Gap |
|------|--------|---------------|-----|
| Booking / appointments | Online booking, bay calendar, ETA | — | **Missing** |
| Service bays | Bay master; HV bay designation | — | **Missing** |
| Technicians | Managed entity: skills, workload, productivity, **HV cert** | free-text name on job card | **Missing (entity)** |
| Cost estimate | Separate itemized estimate, **warranty vs paid**, **digital approval** | — (job card is created already priced) | **Missing** |
| SoH-aware estimate | Battery diagnostic auto-checks warranty vs SoH | we have eligibility logic in Warranty module (reusable) | Partial |
| QC step | Quality check before invoice | — (complete posts straight to GL) | **Missing** |
| EV sign-offs | OTA log, BMS attach, **HV isolation sign-off** | photos only | **Missing** |
| Invoicing | Invoice after QC | complete posts GL directly | Different model |
| Notifications | WhatsApp/SMS/email | — | Defer (platform) |
| Audit trail | Full trail | timestamps only | Partial |

---

## 4. Proposed first version (v1)

Build the **front half + quality rigor** on top of the existing Job Card, in one
coherent slice:

### 4a. New masters
- **Technician** `{ name, skills?, isHVCertified, active }`.
- **ServiceBay** `{ name, isHV, active }`.

### 4b. Service Appointment (booking)
`ServiceAppointment { vehicleId, customerName/Id?, requestedAt, bayId?,
technicianId?, complaint, status: BOOKED → IN_PROGRESS → CONVERTED/CANCELLED }`.
- Simple **assignment** (pick bay + technician). **HV rule:** if the vehicle work
  is HV, only `isHVCertified` technicians + `isHV` bays are selectable.
- "Start work" → **converts the appointment into a Job Card** (carries vehicle,
  bay, technician, complaint).

### 4c. Job Card enhancements
- Link **technicianId** (entity) + **bayId** instead of free-text technician.
- Richer status: `OPEN → IN_PROGRESS → QC → COMPLETED` (+ CANCELLED). A **QC
  sign-off** (passed-by + note) is required to move `QC → COMPLETED`.
- **Warranty vs paid** flag per part/labour line (classification only; totals
  split into paid vs warranty).
- **EV sign-off** fields: `hvIsolationSignedOff` (bool + by/at), optional BMS /
  OTA notes.
- Completion still posts stock + GL for the **paid** portion (warranty portion
  excluded from the customer bill).

### 4d. (Optional, discuss) Cost Estimate
A pre-job **Estimate** doc with lines + warranty/paid + a `approvedByCustomer`
flag, that converts to a Job Card on approval. Bigger — candidate for v1.1.

### Out of v1 (explicitly)
- WhatsApp/SMS/email notifications (platform).
- Real calendar/drag-drop bay board (v1 = simple date + bay select; calendar later).
- OTA/BMS deep integrations (v1 = notes/sign-off fields only).

---

## 5. Data model sketch
```
Technician         id, name, skills?, isHVCertified, active
ServiceBay         id, name, isHV, active
ServiceAppointment id, vehicleId, customerName?, requestedAt, bayId?, technicianId?,
                   complaint, status, jobCardId?  (link once converted)
JobCard            + technicianId?, bayId?, status(OPEN|IN_PROGRESS|QC|COMPLETED|CANCELLED),
                   + qcBy?, qcAt?, hvIsolationBy?, hvIsolationAt?, bmsNote?, otaNote?
JobCardPart/Labor  + billType (PAID | WARRANTY)
```
Clean-boundary rule stays (reference core Item/Customer by id).

---

## 6. Open questions (decide before building)
1. **Scope:** v1 = **appointments + technicians + bays + QC step + warranty/paid
   classification + EV sign-off**, on top of the existing Job Card? (Recommended.)
   Include the separate **Estimate+approval** doc now, or defer to v1.1?
2. **Technician / bay HV rule:** enforce HV-cert + HV-bay for HV jobs in v1? (Recommended yes — it's the EV differentiator.)
3. **Invoicing:** keep "complete posts GL directly" (current), or generate a real
   **Sales Invoice** on completion (ties into Accounts)? 
4. **QC:** a single pass/fail sign-off (recommended) vs a QC checklist?
5. **Customer:** reuse core `Customer` or capture a name string in v1?
6. **Scheduling UI:** simple date + bay/tech selects for v1 (recommended) vs a
   calendar/bay-board now?
7. **Notifications:** confirm deferred for v1.
```
