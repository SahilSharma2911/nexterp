# DMS · Analytics & Compliance — v1 design & discussion

> Status: **DISCUSSION / not built yet.** Captures DMSJoy's "Analytics &
> Compliance" module and maps it to nexterp's existing dashboard + reports.
> Note: this module is mostly a **consumer** of the others — it can only chart
> what the underlying modules produce.
>
> Source: https://www.dmsjoy.com/products (Analytics & Compliance). UI reference:
> `tab-2.png` _(pending — not attached)._

---

## 1. What DMSJoy's module is (literal)

Intro: _"…real-time dashboards and configurable compliance automation — tax /
e-invoicing, EV subsidy tracking, and data-protection regulation readiness — for
the regions you operate in."_

| Capability | Detail (quoted) |
|------------|------------------|
| **Real-Time Dashboards** | "Sales pipeline, inventory aging, service bay utilization, warranty claim status" — live across the network, no batch delay. |
| **Tax & E-Invoicing** | Configurable regional tax / e-invoicing automation. |
| **EV Subsidy Program Tracking** | Subsidy eligibility + claim tracking (we built the engine). |
| **Data-Protection Compliance** | "Regulation readiness" for operating regions. |
| **Custom Report Builder** | Configurable report creation. |
| **Dealer Performance Scorecards** | Per-dealer KPIs. |

**How it works:** data flows in automatically (every operational event) →
dashboards update real-time (no batches) → **compliance reports generated,
scheduled or on-demand, audit-ready**.

---

## 2. What nexterp already has

- **Main dashboard** (real-time, React-Query 60s refresh): stock value,
  receivables, payables, cash, month sales/purchases, overdue, low stock; charts
  (sales-vs-purchases, cash trend, stock-by-warehouse); panels (top items, open
  SOs, recent movements, recent GL, low stock).
- **Accounts reports:** General Ledger, Trial Balance.
- DMS data exists (vehicles, job cards, warranty/subsidy claims) but **no
  DMS-specific analytics** yet.

---

## 3. Gap analysis (DMSJoy vs us)

| Area | DMSJoy | nexterp today | Gap / dependency |
|------|--------|---------------|------------------|
| Real-time **ERP** KPIs | ✅ | ✅ | done |
| **Vehicle lifecycle** analytics | by stage/location | — | needs lifecycle v1 |
| **Service** analytics (bay utilization, throughput) | ✅ | — | **needs Service v1 (bays)** |
| **Warranty claim status** funnel | ✅ | — | reuse existing warranty data |
| **Subsidy** tracking | ✅ | engine built, no analytics | reuse existing subsidy data |
| **Inventory aging** | ✅ | — | reuse stock ledger / bins |
| **Sales pipeline** | ✅ | — | **needs CRM (not built)** |
| **Dealer scorecards** | ✅ | — | overlaps network-management doc |
| **Tax & e-invoicing** | ✅ | **none (no tax engine at all)** | **large, ERP-wide** |
| **Data-protection** | ✅ | — | partly audit log (network v1.1) + export/delete |
| **Custom report builder** | ✅ | — | large |
| **Scheduled/on-demand reports** | ✅ | — | on-demand = export; scheduled needs a job runner |

---

## 4. Proposed first version (v1)

Analytics v1 can only chart **what already exists**, so scope it to that + quick
compliance wins:

### 4a. DMS / Network Analytics page (real-time, reuse data)
- **Warranty**: claim funnel (DRAFT→SUBMITTED→APPROVED/REJECTED→SETTLED),
  **approval rate**, totals **claimed vs approved vs received**, **expiring-soon**.
- **Subsidy**: claims by status, **claimed vs approved vs disbursed**, by scheme.
- **Inventory aging**: stock value bucketed by age (needs ledger dates) — "how
  long has stock sat".
- **Vehicles**: by status/stage (richer once the lifecycle v1 lands).
- **Dealer scorecards**: per-dealer units/service/warranty rollups (shared with
  the network doc).
- All on the existing React-Query auto-refresh pattern.

### 4b. On-demand "audit-ready" exports (quick win)
- **CSV export** button on the main list tables (vehicles, claims, GL, etc.) →
  covers "on-demand, audit-ready" without a report-builder.

### Out of v1 (bigger / dependent tracks)
- **Tax & e-invoicing** — a real tax engine on invoices (GST/VAT). Large,
  ERP-wide; its own project. *(This is the long-standing ERP tax gap.)*
- **Sales pipeline analytics** — needs a CRM module first.
- **Service bay utilization** — needs the Service v1 (bays) first.
- **Custom report builder**, **scheduled reports**, **data-protection tooling**
  (consent, export/delete) — later.

---

## 5. Data model / work sketch
```
(mostly read-only — aggregations over existing tables)
lib/services/dms-analytics.ts   // warranty funnel, subsidy totals, inventory aging, dealer scorecards
app/api/dms-analytics/route.ts  // one payload, React Query + refetchInterval
features/dms-analytics/*        // the page + charts (reuse shadcn charts)
+ CSV export helper used by list tables
later: Tax engine (TaxTemplate, line tax), AuditLog, ReportDefinition (builder)
```

---

## 6. Open questions (decide before building)
1. **Scope:** v1 = **DMS analytics page (warranty + subsidy + inventory aging +
   vehicles + dealer scorecards) + CSV export**, reusing existing data? _(Rec.)_
2. **Tax & e-invoicing:** treat as a **separate, later ERP project** (it's big and
   cross-cutting), not part of Analytics v1? _(Rec. yes.)_
3. **Placement:** a dedicated **"Analytics" page**, or extend the main dashboard
   with DMS cards?
4. **Dealer scorecards:** build here or in the **network-management** v1 (they
   overlap — build once, link from both)?
5. Confirm **custom report builder, scheduled reports, data-protection tooling**
   are deferred.
```
