# Seeka Motor — How the modules connect

A visual guide to how the platform fits together. Two ideas explain almost
everything:

- **Stock Ledger** — the single source of truth for *quantity on hand*. Anything
  that moves inventory writes here.
- **General Ledger (GL)** — the single source of truth for *money*. Anything
  with a financial value writes here.

Every module is just a document that, at the right moment, posts to one or both
of these ledgers. That's the whole system.

---

## 1. The big picture

```mermaid
flowchart LR
  OEM([OEM / Supplier])

  subgraph MASTERS[Masters]
    ITEMS[Items<br/>spare parts · accessories]
    WARE[Warehouses]
    DEAL[Dealers]
    TECH[Technicians]
    BAYS[Service Bays]
  end

  subgraph DMS[Dealership flows]
    VEH[Vehicle<br/>VIN · lifecycle]
    APPT[Service Appointment]
    JOB[Job Card]
    WAR[Warranty]
    WCL[Warranty Claim]
    SUB[Subsidy Claim]
  end

  subgraph CORE[Core engines — the truth]
    STOCK[(Stock Ledger)]
    GL[(General Ledger)]
  end

  OEM -->|buy vehicles| VEH
  OEM -->|buy parts & accessories| ITEMS

  ITEMS -->|received / issued| STOCK
  VEH -->|allocate → … → deliver| CUST([Customer])

  VEH -->|deliver: accessories issued| STOCK
  VEH -->|deliver: Vehicle + Accessory Sales| GL

  APPT -->|start work| JOB
  JOB -->|parts consumed| STOCK
  JOB -->|Service Income| GL

  VEH --- WAR
  WAR --- WCL
  JOB -.->|fault found| WCL
  VEH --- SUB

  STOCK --> DASH[Dashboard &<br/>Analytics]
  GL --> DASH

  classDef core fill:#eef2ff,stroke:#6366f1,color:#111;
  classDef money fill:#ecfdf5,stroke:#10b981,color:#111;
  class STOCK,GL core;
```

**Read it as:** the OEM supplies **vehicles** and **items**; those flow through
the dealership documents; and whenever stock or money actually moves, it lands in
the **Stock Ledger** / **General Ledger**, which the **Dashboard** then
summarises.

---

## 2. The vehicle sale — lifecycle

A vehicle is a **serialized unit** (one VIN). It moves through fixed stages;
only **delivery** touches money and stock.

```mermaid
flowchart LR
  A[IN_STOCK<br/>at warehouse] -->|Allocate<br/>+ pick dealer| B[ALLOCATED]
  B -->|Dispatch| C[IN_TRANSIT]
  C -->|Receive| D[AT_DEALER]
  D -->|Run PDI ✓| E[PDI_DONE]
  E -->|Deliver| F[DELIVERED]

  D -. fit accessories .-> ACC[Accessories<br/>helmet, mat …]
  E -. fit accessories .-> ACC
  ACC -. carried into sale .-> F

  F ==>|accessories issued| SL[(Stock Ledger)]
  F ==>|Debtors Dr /<br/>Vehicle + Accessory Sales Cr| GL[(General Ledger)]
  F --> CUST([Customer])

  classDef money fill:#ecfdf5,stroke:#10b981,color:#111;
  class SL,GL money;
```

**Key points**

- Allocate → Dispatch → Receive → PDI are **logistics only** — no money, no stock.
- **Accessories** can be fitted any time before delivery (recorded on the car).
- **Deliver** is the sale: accessories leave stock, and the vehicle + accessory
  revenue post to the GL — once.

---

## 3. Service & workshop — after the sale

The same car comes back many times for service. This is where **Items (spare
parts)** meet the vehicle.

```mermaid
flowchart TB
  CUST([Customer books]) --> APPT[Service Appointment<br/>vehicle · bay · technician]
  APPT -->|HV rule:<br/>HV job → HV bay + certified tech| APPT
  APPT -->|Start work| JOB[Job Card<br/>OPEN]

  JOB --> PARTS[Parts<br/>Items from stock]
  JOB --> LAB[Labour]
  JOB --> QC[Quality Check sign-off]

  JOB ==>|Complete| DONE[COMPLETED]
  DONE ==>|parts issued| SL[(Stock Ledger)]
  DONE ==>|Debtors Dr /<br/>Service Income Cr| GL[(General Ledger)]
  DONE -. appears in .-> HIST[Vehicle service history]

  DONE -.->|cancel reverses both| SL
  DONE -.->|cancel reverses both| GL

  classDef money fill:#ecfdf5,stroke:#10b981,color:#111;
  class SL,GL money;
```

**Key points**

- A **Service Appointment** is the booking; **Start work** turns it into a **Job
  Card**.
- Completing the job **issues the parts** (stock down) and **bills the customer**
  (Service Income). Cancel reverses both.

---

## 4. The Items seam — why parts & accessories matter

`Item` is one shared concept used two different ways by the dealership. (Note:
vehicles are **not** built from a BOM — they're bought-in finished units.)

```mermaid
flowchart LR
  subgraph ITEMS[Items master]
    SP[Spare Parts<br/>SP-BRAKE, SP-COOLANT …]
    AC[Accessories<br/>ACC-HELMET, ACC-MAT …]
  end

  SP -->|consumed in| JOB[Job Card<br/>repair/service]
  AC -->|sold with car in| VEH[Vehicle delivery]

  JOB -->|parts out| SL[(Stock Ledger)]
  VEH -->|accessories out| SL
  JOB -->|Service Income| GL[(General Ledger)]
  VEH -->|Accessory Sales| GL

  classDef money fill:#ecfdf5,stroke:#10b981,color:#111;
  class SL,GL money;
```

---

## 5. Warranties, claims & subsidies (tracked alongside)

```mermaid
flowchart LR
  VEH[Vehicle] --> WAR[Warranty<br/>component · terms]
  WAR --> WCL[Warranty Claim<br/>Draft → Submitted → Approved → Settled]
  JOB[Job Card] -.->|raised from| WCL
  WCL -->|eligibility check:<br/>period · km · battery SoH| WCL

  VEH --> SUB[Subsidy Claim]
  SCH[Subsidy Scheme] --> SUB
  SUB -->|KYC verified → approve → e-voucher → disburse| SUB
```

These don't move core stock; they track OEM reimbursements and government EV
incentives against the vehicle.

---

## In one sentence

> **Masters** (items, dealers, technicians…) feed **dealership documents**
> (vehicles, job cards, appointments…), and every time stock or money actually
> moves, it's recorded in the **Stock Ledger** and **General Ledger** — which the
> **Dashboard** rolls up.
