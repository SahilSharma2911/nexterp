# DMS · Multi-Dealership Network Management — v1 design & discussion

> Status: **DISCUSSION / not built yet.** Captures DMSJoy's "Multi-Dealership
> Network Management" and maps it to nexterp. **Read §2 first — this is NOT the
> multi-tenancy we removed.**
>
> Source: https://www.dmsjoy.com/products (Multi-Dealership Network Management).
> UI reference: `slide-1 (1).png … slide-6 (1).png` _(pending — not attached)._

---

## 1. What DMSJoy's module is (literal)

Intro: _"…enables OEMs to operate a unified control center monitoring their
dealer network at scale — from 5 to 500 locations — with centralized oversight,
standardized operations, and real-time performance visibility."_

| Capability | Detail (quoted) |
|------------|------------------|
| **Central OEM Dashboard** | Real-time across **sales, inventory, service, warranty**; drill-down by **region / dealer / vehicle model**; no batch delay. |
| **Role Hierarchy & Access Control** | **Eight** roles: OEM admin · regional manager · dealer principal · showroom manager · sales executive · service advisor · technician · parts manager. Custom roles supported. |
| **Inter-Dealer Transfers** | Vehicle & parts: **request → approve → dispatch → receive**, full audit trail. |
| **Dealer Onboarding** | Onboard in hours via templates, role setup, data migration. |
| **Process Standardization** | OEM-enforced SOPs: **mandatory fields, approval workflows, compliance checklists**, EV test-drive tracking. |
| **Activity Audit Log** | Every action: **user, timestamp, IP, device** — exportable for audits. |

**How it works:** OEM defines structure (roles/processes) → dealers operate
uniformly (enforced workflows) → OEM monitors real-time.

---

## 2. ⚠️ Important: this is NOT the multi-tenancy we removed

- **Multi-tenancy** (removed, replaced by **clone-per-customer**) = many separate
  **OEM customers**, each isolated. One clone = one OEM.
- **Multi-dealership network** (this module) = **one OEM** managing **many dealers
  inside their single clone**. The dealers are a hierarchy *within* one instance.

So this module is **fully compatible** with clone-per-customer: each OEM clone has
one network of many dealers; the "central console" is that OEM's cross-dealer view
of their own data. No cross-customer isolation involved.

---

## 3. What nexterp already has

- **Dealer** entity (the network nodes) + `Dealer.vehicleCount`.
- **Vehicle → dealer** allocation (`Vehicle.dealerId`).
- Flat functional **roles**: ADMIN / STOCK / BUYING / SELLING / ACCOUNTS / VIEWER
  — no hierarchy, no dealer assignment to users.
- No per-dealer data scoping, no OEM console, no transfers, no audit log.

---

## 4. The one big decision: scoped access, or just reporting?

Two very different levels of ambition. **Pick one for v1.**

### Option A — "Network **visibility**" (light, low risk)
Dealer stays an **attribute** on records; add an **OEM console** that rolls up /
drills down by dealer & region. **Everyone still sees everything** (single-OEM
staff). Cheap, fast, no access-control rework.
- Good if: the clone is run by the OEM's head office / a small team.

### Option B — "Network **operations**" (full, heavier)
Users are **assigned to a dealer**; **dealer staff see only their dealer's** data;
OEM/regional roles see across. This needs a **dealerId on operational records +
query scoping by the logged-in user's dealer** — the same *kind* of row-scoping
we did for tenancy, but **by dealer within one instance** (not across customers).
- Good if: real dealer principals / sales execs log in and must be walled to
  their own dealership.

> Note: B is the heavy part. It's legitimate DMS behaviour (a dealer shouldn't see
> another dealer's leads/sales), but it's a real architectural slice. A is a
> fraction of the effort.

---

## 5. Proposed first version (v1)

**Recommended: start with Option A + the cheap structural bits, leave B for v1.1.**

### v1 (Option A core)
1. **Role hierarchy (structure only):** add a `scopeLevel` to users — `OEM` /
   `REGION` / `DEALER` — and let a user be assigned a **dealerId** (nullable =
   OEM-level). Keep the existing functional roles. *(No enforcement yet — just the
   model + UI, so B is a config flip later.)*
2. **Central OEM console:** a dashboard page with **per-dealer rollups** — vehicles
   by stage, open job cards, warranty claims, sales — and **drill-down by dealer /
   region**. Reuses existing data (`dealerId`).
3. **Dealer scorecards:** per-dealer KPIs (units delivered, service throughput,
   warranty approval rate, outstanding).
4. **Inter-dealer vehicle transfer:** a doc **request → approve → dispatch →
   receive** that reassigns `Vehicle.dealerId` with an event trail. (Parts transfer
   = reuse core Stock Entry transfer, later.)

### v1.1 (Option B, if chosen)
5. **Dealer-scoped access:** enforce — dealer users auto-filtered to their dealer;
   OEM/regional unscoped. (Row-scoping by `dealerId`, driven by the session.)
6. **Activity audit log:** user / timestamp / IP / device, exportable.
7. **SOP enforcement + onboarding templates.**

### Out of v1
- Audit log, SOP engine, onboarding wizard, custom-role builder, notifications.

---

## 6. Data model sketch
```
User            + dealerId?  (null = OEM-level), + scopeLevel (OEM|REGION|DEALER), + region?
Dealer          + region?    (for regional rollups)
DealerTransfer  id, vehicleId, fromDealerId?, toDealerId, status(REQUESTED→APPROVED→
                DISPATCHED→RECEIVED|CANCELLED), requestedBy, approvedBy, dates
VehicleEvent    (reuse from lifecycle doc) — logs the transfer legs
AuditLog        id, userId, action, entity, entityId, at, ip, device   // v1.1
```
Operational records already carry `dealerId` via the vehicle; job cards / warranties
/ subsidies resolve their dealer through the vehicle (or add a direct `dealerId` in
v1.1 when we enforce scoping).

---

## 7. Open questions (decide before building)
1. **A or B for v1?** Network **visibility** (OEM console + scorecards + transfers,
   everyone sees all) vs full **dealer-scoped access**. _(Recommended: A now, B as
   v1.1.)_
2. **Regions:** do we need a region layer (group dealers), or just dealer-level
   rollups for v1?
3. **Roles:** add the `scopeLevel` + dealer assignment to users now (cheap, future-
   proofs B), even under Option A? _(Recommended yes.)_
4. **Transfers:** vehicles only for v1 (parts via existing Stock Entry later)?
5. **Audit log:** confirm deferred to v1.1.
```
