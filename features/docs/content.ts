// Documentation content. Plain data so pages stay simple and static.

export type DocSection = {
  heading: string;
  body?: string[];
  list?: string[];
};

export type Doc = {
  slug: string;
  title: string;
  area: string;
  open?: string; // link to the live module
  summary: string;
  sections: DocSection[];
};

export const AREAS = [
  "Stock",
  "Manufacturing",
  "Buying",
  "Selling",
  "Accounts",
  "Dealership",
] as const;

export const DOCS: Doc[] = [
  // ---------------- Stock ----------------
  {
    slug: "items",
    title: "Items",
    area: "Stock",
    open: "/stock/items",
    summary: "Your products and materials — the “what” everything else refers to.",
    sections: [
      {
        heading: "What it is",
        body: [
          "An Item is anything you buy, sell, store, or build — a finished product, a raw material, or even a service.",
          "Every other document (orders, receipts, invoices, BOMs) points at Items, so this is usually the first thing you set up.",
        ],
      },
      {
        heading: "Key fields",
        list: [
          "Item Code (SKU) — the unique id. Leave blank and the system auto-generates one like ITEM-00042.",
          "Unit of Measure (UOM) — how it's counted/sold (Nos, Kg, Litre, Box…).",
          "Valuation Rate — cost per unit. Standard Selling Rate — default sale price.",
          "Image — an optional product photo, shown in lists and on the item.",
          "Maintain stock — track it in inventory (uncheck for services).",
          "Has serial / batch — declare serial- or batch-tracked items.",
          "Specifications — free key/value facts (Material, Weight…).",
          "Variants — mark an item a “template” and generate child items from attributes (Size: S/M/L × Colour).",
        ],
      },
      {
        heading: "How it connects",
        body: [
          "Stock levels are tracked per Item per Warehouse. Items appear on Stock Entries, BOMs, Work Orders, Orders, Receipts, Deliveries and Invoices.",
        ],
      },
    ],
  },
  {
    slug: "warehouses",
    title: "Warehouses",
    area: "Stock",
    open: "/stock/warehouses",
    summary: "Your stock locations — the “where”.",
    sections: [
      {
        heading: "What it is",
        body: [
          "A Warehouse is any place you hold stock: a store, a shelf, a transit area, a finished-goods room. Stock is always counted per item per warehouse.",
        ],
      },
      {
        heading: "Key fields",
        list: [
          "Name & Type (Stores, Transit, Finished Goods…).",
          "Address and contact details (person, phone, email).",
        ],
      },
      {
        heading: "How it connects",
        body: [
          "Every stock movement names a warehouse. Transfers move stock between two warehouses; receipts/deliveries name the warehouse goods arrive into or ship from.",
        ],
      },
    ],
  },
  {
    slug: "stock-entry",
    title: "Stock Entry",
    area: "Stock",
    open: "/stock/stock-entry",
    summary: "Record internal stock movements.",
    sections: [
      {
        heading: "What it is",
        body: [
          "A Stock Entry records stock moving inside your own company — not buying or selling. It's the general-purpose way to add, remove, move, or transform stock.",
        ],
      },
      {
        heading: "The five purposes",
        list: [
          "Material Receipt — bring stock in without a purchase (opening stock, found items).",
          "Material Issue — take stock out without a sale (used, damaged, scrapped).",
          "Material Transfer — move stock from one warehouse to another.",
          "Manufacture — consume raw materials and produce a finished item.",
          "Repack — repackage the same goods (1 kg bag → 10 × 100 g).",
        ],
      },
      {
        heading: "How it works",
        body: [
          "Create a Draft, add the items, warehouses and quantities, then Submit — only then does stock actually change. Cancel reverses everything.",
        ],
      },
      {
        heading: "How it connects",
        body: [
          "On submit it writes lines to the Stock Ledger and updates the Stock Balance (with moving-average cost). A Work Order automatically creates a Manufacture-type Stock Entry.",
        ],
      },
    ],
  },
  {
    slug: "stock-reconciliation",
    title: "Stock Reconciliation",
    area: "Stock",
    open: "/stock/reconciliation",
    summary: "Fix stock records after a physical count.",
    sections: [
      {
        heading: "What it is",
        body: [
          "A reality check. You physically count a shelf and tell the system the real number; it snaps its records to match and logs the difference.",
          "Unlike a Stock Entry (where you enter a change like +5 or −3), here you enter the final counted total and the system works out the gap.",
        ],
      },
      {
        heading: "How you find a mismatch",
        body: [
          "The system can't see your shelf — it only knows the “book” number from recorded documents. You discover differences by doing a physical count (a “stock take”) and comparing it to the Stock Balance report.",
        ],
      },
      {
        heading: "How it works",
        list: [
          "Open Stock Balance to see the system's current numbers.",
          "Count the shelves for real.",
          "Create a Reconciliation → item + warehouse + counted qty.",
          "Submit — the detail shows Counted vs Was vs Difference, and stock is adjusted.",
          "Cancel restores the pre-count snapshot.",
        ],
      },
    ],
  },
  {
    slug: "stock-ledger",
    title: "Stock Ledger",
    area: "Stock",
    open: "/stock/ledger",
    summary: "The permanent history of every stock movement.",
    sections: [
      {
        heading: "What it is",
        body: [
          "The audit trail — one line for every single stock change, newest first. Think of it as your bank statement for inventory. It's read-only; lines are written automatically whenever a document is submitted.",
        ],
      },
      {
        heading: "What each line shows",
        list: [
          "When, which item, which warehouse.",
          "Voucher — the document that caused it (click it to open that document).",
          "In/Out — the movement (+ or −) and the running balance after it.",
          "Valuation rate and stock value at that moment.",
        ],
      },
      {
        heading: "How it connects",
        body: [
          "Every receipt, delivery, stock entry and reconciliation lands here. The Stock Balance is simply the running total of these lines.",
        ],
      },
    ],
  },
  {
    slug: "stock-balance",
    title: "Stock Balance",
    area: "Stock",
    open: "/stock/balance",
    summary: "Current on-hand quantity and value.",
    sections: [
      {
        heading: "What it is",
        body: [
          "The live number per item per warehouse — the “account balance” built from the Stock Ledger. Read-only.",
        ],
      },
      {
        heading: "The columns",
        list: [
          "Actual — what's physically on hand now.",
          "Reserved — already promised to open Sales Orders.",
          "Ordered — on the way in from open Purchase Orders.",
          "Projected — Actual + Ordered − Reserved (what you'll really have soon).",
          "Val. Rate & Stock Value — average cost and money on the shelf.",
        ],
      },
      {
        heading: "How you use it",
        body: [
          "It's your go-to for “how much do I have, and is it enough?” — and the sheet you print before a physical count / reconciliation.",
        ],
      },
    ],
  },
  // ---------------- Manufacturing ----------------
  {
    slug: "bom",
    title: "Bill of Materials (BOM)",
    area: "Manufacturing",
    open: "/manufacturing/bom",
    summary: "The recipe that defines what makes a product.",
    sections: [
      {
        heading: "What it is",
        body: [
          "A BOM lists the raw materials (and sub-assemblies) needed to make one unit of a finished item — the recipe.",
          "BOMs can be multi-level: a component can itself have a BOM. On submit, the system “explodes” the recipe down to the underlying raw materials and totals the cost.",
        ],
      },
      {
        heading: "How it works",
        list: [
          "Pick the finished item and the quantity it produces.",
          "Add component items with quantities and rates.",
          "Submit to activate it — now it can be used by Work Orders.",
        ],
      },
      {
        heading: "How it connects",
        body: [
          "A Work Order is created from a BOM. Open an active BOM and use “Create Work Order” to start production with it pre-filled.",
        ],
      },
    ],
  },
  {
    slug: "work-order",
    title: "Work Order",
    area: "Manufacturing",
    open: "/manufacturing/work-order",
    summary: "The job that consumes materials and produces finished goods.",
    sections: [
      {
        heading: "What it is",
        body: [
          "A Work Order is an instruction to make a quantity of a product using a BOM. It knows the materials required and tracks how much has been produced.",
        ],
      },
      {
        heading: "How it works",
        list: [
          "Pick a BOM and the quantity to manufacture; choose the source (raw) and finished-goods warehouses.",
          "Click “Finish production” (you can finish partially) — this consumes the raw materials and receives the finished goods.",
          "Finishing posts a Manufacture-type Stock Entry behind the scenes.",
        ],
      },
      {
        heading: "How it connects",
        body: [
          "Pulls its recipe from a BOM, consumes/produces Items, moves stock between Warehouses, and creates Stock Entries you can open from the Work Order.",
        ],
      },
    ],
  },
  // ---------------- Buying ----------------
  {
    slug: "suppliers",
    title: "Suppliers",
    area: "Buying",
    open: "/buying/suppliers",
    summary: "The vendors you buy from.",
    sections: [
      {
        heading: "What it is",
        body: ["A Supplier is a party you purchase from — named on Purchase Orders, Receipts and Purchase Invoices."],
      },
    ],
  },
  {
    slug: "purchase-order",
    title: "Purchase Order",
    area: "Buying",
    open: "/buying/purchase-order",
    summary: "Your order placed with a supplier.",
    sections: [
      {
        heading: "What it is",
        body: [
          "A Purchase Order (PO) is a promise to buy — items, quantities and prices you've agreed with a supplier. It isn't stock yet.",
        ],
      },
      {
        heading: "How it works",
        body: [
          "Submit the PO to commit it; the quantity shows as “Ordered” (incoming) on Stock Balance. From an open PO, use “Create Receipt” to receive the goods.",
        ],
      },
      {
        heading: "How it connects",
        body: ["Links a Supplier + Items; fulfilled by a Purchase Receipt, and later billed by a Purchase Invoice."],
      },
    ],
  },
  {
    slug: "purchase-receipt",
    title: "Purchase Receipt",
    area: "Buying",
    open: "/buying/purchase-receipt",
    summary: "Goods arriving into stock from a supplier.",
    sections: [
      {
        heading: "What it is",
        body: [
          "A Purchase Receipt records goods actually received. Submitting it raises stock (with the purchase cost as valuation) and fulfils the linked Purchase Order.",
        ],
      },
      {
        heading: "How it connects",
        body: ["Can be created against a PO (quantities pre-filled) or standalone. Writes to the Stock Ledger and Stock Balance."],
      },
    ],
  },
  // ---------------- Selling ----------------
  {
    slug: "customers",
    title: "Customers",
    area: "Selling",
    open: "/selling/customers",
    summary: "The parties you sell to.",
    sections: [
      {
        heading: "What it is",
        body: ["A Customer is named on Sales Orders, Delivery Notes and Sales Invoices."],
      },
    ],
  },
  {
    slug: "sales-order",
    title: "Sales Order",
    area: "Selling",
    open: "/selling/sales-order",
    summary: "A customer's confirmed order.",
    sections: [
      {
        heading: "What it is",
        body: [
          "A Sales Order (SO) captures what a customer wants, at agreed prices. Submitting it reserves that stock so it isn't sold twice.",
        ],
      },
      {
        heading: "How it works",
        body: ["The reserved quantity shows on Stock Balance. From an open SO, use “Create Delivery” to ship the goods."],
      },
      {
        heading: "How it connects",
        body: ["Links a Customer + Items; fulfilled by a Delivery Note, and billed by a Sales Invoice."],
      },
    ],
  },
  {
    slug: "delivery-note",
    title: "Delivery Note",
    area: "Selling",
    open: "/selling/delivery-note",
    summary: "Goods shipped out to a customer.",
    sections: [
      {
        heading: "What it is",
        body: [
          "A Delivery Note records goods leaving for the customer. Submitting it reduces stock, captures the cost of goods delivered (COGS), and fulfils the linked Sales Order.",
        ],
      },
      {
        heading: "How it connects",
        body: ["Created against an SO (quantities pre-filled) or standalone. Writes to the Stock Ledger and Stock Balance."],
      },
    ],
  },
  // ---------------- Accounts ----------------
  {
    slug: "chart-of-accounts",
    title: "Chart of Accounts",
    area: "Accounts",
    open: "/accounts/chart",
    summary: "The list of accounts money is recorded against.",
    sections: [
      {
        heading: "What it is",
        body: [
          "Your bookkeeping “buckets” — Cash, Bank, Debtors, Creditors, Sales, COGS, and so on — grouped under the five roots: Asset, Liability, Income, Expense, Equity.",
        ],
      },
      {
        heading: "How it connects",
        body: [
          "Every accounting entry hits two accounts (a debit and a credit). Invoices and payments post to these accounts automatically.",
          "The dealership side posts here too: a vehicle delivery credits Vehicle Sales (and Accessory Sales for extras), and a completed service job card credits Service Income — all against Debtors.",
        ],
      },
    ],
  },
  {
    slug: "sales-invoice",
    title: "Sales Invoice",
    area: "Accounts",
    open: "/accounts/sales-invoice",
    summary: "The bill you raise to a customer.",
    sections: [
      {
        heading: "What it is",
        body: [
          "A Sales Invoice records that a customer owes you money (a receivable). Submitting it posts the accounting entries (debit Debtors, credit Sales).",
        ],
      },
      {
        heading: "How it connects",
        body: ["Settled by a Payment Entry; its outstanding amount shows on the Dashboard and ages until paid."],
      },
    ],
  },
  {
    slug: "purchase-invoice",
    title: "Purchase Invoice",
    area: "Accounts",
    open: "/accounts/purchase-invoice",
    summary: "A supplier's bill you record.",
    sections: [
      {
        heading: "What it is",
        body: [
          "A Purchase Invoice records that you owe a supplier money (a payable). Submitting it posts the accounting entries.",
        ],
      },
      {
        heading: "How it connects",
        body: ["Settled by a Payment Entry; its outstanding amount is your payables."],
      },
    ],
  },
  {
    slug: "payment-entry",
    title: "Payment Entry",
    area: "Accounts",
    open: "/accounts/payment-entry",
    summary: "Money received or paid out.",
    sections: [
      {
        heading: "What it is",
        body: [
          "A Payment Entry records cash/bank movement: Receive (money in from a customer) or Pay (money out to a supplier). It settles the related invoice's outstanding amount.",
        ],
      },
      {
        heading: "How it connects",
        body: ["Moves money between a cash/bank account and a party; posts to the General Ledger."],
      },
    ],
  },
  {
    slug: "general-ledger",
    title: "General Ledger",
    area: "Accounts",
    open: "/accounts/general-ledger",
    summary: "The history of every accounting entry.",
    sections: [
      {
        heading: "What it is",
        body: [
          "The money version of the Stock Ledger — one line per debit or credit, newest first, each traceable to the voucher that created it. Read-only.",
        ],
      },
      {
        heading: "How it connects",
        body: ["Every invoice and payment writes here. The Trial Balance summarises it into one balance per account."],
      },
    ],
  },
  {
    slug: "trial-balance",
    title: "Trial Balance",
    area: "Accounts",
    open: "/accounts/trial-balance",
    summary: "Closing balance per account — proof the books balance.",
    sections: [
      {
        heading: "What it is",
        body: [
          "A summary of every account's closing balance. Total debits must equal total credits — if they do, the books are balanced (double-entry is intact).",
        ],
      },
    ],
  },

  // ---------------- Dealership (EV DMS) ----------------
  {
    slug: "dealership",
    title: "Dealership — start here",
    area: "Dealership",
    open: "/dms/vehicles",
    summary:
      "The EV dealer side — selling, servicing and warrantying individual vehicles.",
    sections: [
      {
        heading: "The big picture",
        body: [
          "The Dealership module manages actual EV units — each a unique vehicle with its own VIN, battery and motor. It sits on top of the generic ERP and reuses its stock + accounting.",
          "Two different journeys happen to every vehicle: you sell it ONCE, and you service it MANY times after.",
        ],
      },
      {
        heading: "Vehicle vs Item — the key idea",
        body: [
          "A Vehicle is a unique, serialized unit, tracked one-by-one by VIN. An Item is generic stock, counted by quantity (150 wheels, 40 chargers).",
          "Spare parts and accessories are Items. They attach to a specific vehicle only through a document — an accessory line at delivery, or a part on a service job card.",
        ],
      },
      {
        heading: "Sell once, service forever",
        list: [
          "Lifecycle — selling a NEW vehicle: warehouse → allocated → in transit → at dealer → PDI → delivered. Happens once.",
          "Job Card — servicing/repairing the vehicle LATER: happens again and again over its life.",
          "Warranty — coverage registered at the sale; claims raised when a component fails.",
          "Subsidy — a government/OEM EV incentive claimed for the sale.",
        ],
      },
    ],
  },
  {
    slug: "vehicles",
    title: "Vehicles & Lifecycle",
    area: "Dealership",
    open: "/dms/vehicles",
    summary: "Each EV unit and its journey from the warehouse to the customer.",
    sections: [
      {
        heading: "What a vehicle is",
        list: [
          "VIN — the vehicle's unique id (like a chassis number).",
          "Motor serial & Battery serial — exactly which motor/battery is in this car (vital for warranty and recalls).",
          "Battery State of Health (SoH) — the battery's condition as a %.",
          "Model, variant, colour, purchase/selling rates, and a photo.",
        ],
      },
      {
        heading: "The lifecycle — selling a new vehicle",
        body: [
          "A vehicle moves through stages, one step at a time. You advance it with the action button on its detail page; every step is recorded in the timeline, so you always know where each car is.",
        ],
        list: [
          "At Warehouse — arrived at your store, not assigned yet.",
          "Allocated — assigned to a dealer (allocate the oldest-received first — FIFO).",
          "In Transit — shipped to the dealer.",
          "At Dealer — arrived at the showroom.",
          "PDI Passed — Pre-Delivery Inspection passed (a checklist: brakes, battery, lights…). Must pass before delivery.",
          "Delivered — handed over to the customer.",
        ],
      },
      {
        heading: "Delivery posts to the books",
        body: [
          "On Deliver you record the customer and any accessories sold (helmet, floor mat…). Accessories are issued from stock, and the whole sale posts to the ledger: Debtors Dr, Vehicle Sales Cr (plus Accessory Sales Cr for the extras).",
        ],
      },
    ],
  },
  {
    slug: "dealers",
    title: "Dealers",
    area: "Dealership",
    open: "/dms/dealers",
    summary: "The dealerships in your network.",
    sections: [
      {
        heading: "What it is",
        body: [
          "A Dealer is a dealership location — code, name, contact person, address, GSTIN. Vehicles get allocated to dealers, and each dealer shows its assigned vehicle count.",
        ],
      },
      {
        heading: "How it connects",
        body: [
          "Allocating a vehicle links it to a dealer. A dealer that still has vehicles assigned can't be deleted — disable it instead.",
        ],
      },
    ],
  },
  {
    slug: "job-cards",
    title: "Job Cards (Service)",
    area: "Dealership",
    open: "/dms/job-cards",
    summary: "A workshop service or repair visit for one vehicle.",
    sections: [
      {
        heading: "What it is",
        body: [
          "A Job Card is one service visit — like a garage job-sheet. It records the vehicle, the complaint, the parts used, the labour, and photos. A vehicle has many job cards over its life.",
        ],
      },
      {
        heading: "Parts + labour",
        list: [
          "Parts — Items consumed from stock (brake pads, coolant).",
          "Labour — the work done, as hours × rate.",
          "Photos — documentation of the job.",
        ],
      },
      {
        heading: "Completing it",
        body: [
          "On Complete, the parts are issued from the warehouse (stock goes down) and the bill posts to the ledger (Debtors Dr / Service Income Cr). Cancel reverses both. It stays in the vehicle's service history.",
        ],
      },
      {
        heading: "Service & Workshop",
        body: [
          "A job card can be assigned a Technician and a Service Bay, flagged as high-voltage work, and signed off with a Quality Check (who inspected it + a note). Starting a Service Appointment creates the job card for you with these already filled in.",
        ],
      },
    ],
  },
  {
    slug: "service-appointments",
    title: "Service Appointments",
    area: "Dealership",
    open: "/dms/service-appointments",
    summary: "Book a service visit, assign a bay + technician, then start work.",
    sections: [
      {
        heading: "What it is",
        body: [
          "An Appointment is a booking for a future service visit. It captures the vehicle, customer, requested time, and the planned bay + technician — before any work or parts are committed.",
        ],
      },
      {
        heading: "The HV rule",
        body: [
          "Tick “high-voltage work” for battery/motor jobs. Only HV-certified technicians and HV-equipped bays can then be assigned — the system blocks an unsafe pairing.",
        ],
      },
      {
        heading: "Start work",
        body: [
          "When the vehicle arrives, Start work converts the appointment into an open Job Card — carrying the vehicle, complaint, technician, bay and HV flag across. You then add parts/labour and Complete it as usual. The appointment is marked Converted and links to its job card.",
        ],
      },
    ],
  },
  {
    slug: "technicians",
    title: "Technicians",
    area: "Dealership",
    open: "/dms/technicians",
    summary: "Workshop technicians, including HV certification.",
    sections: [
      {
        heading: "What it is",
        body: [
          "The people who do the work. Each technician has their skills and an HV-certified flag. Only HV-certified technicians can be assigned to high-voltage appointments and job cards.",
        ],
      },
      {
        heading: "Note",
        body: [
          "Technicians referenced by appointments or job cards can't be deleted — mark them inactive instead, which hides them from new assignments while keeping history intact.",
        ],
      },
    ],
  },
  {
    slug: "service-bays",
    title: "Service Bays",
    area: "Dealership",
    open: "/dms/service-bays",
    summary: "Physical workshop bays, including HV bays.",
    sections: [
      {
        heading: "What it is",
        body: [
          "The physical stalls where vehicles are serviced. An HV bay is equipped for high-voltage work; standard bays are not. High-voltage appointments and job cards require an HV bay.",
        ],
      },
    ],
  },
  {
    slug: "warranties",
    title: "Warranties",
    area: "Dealership",
    open: "/dms/warranties",
    summary: "Component coverage registered for a vehicle.",
    sections: [
      {
        heading: "What it is",
        body: [
          "A Warranty is coverage for a vehicle component — Vehicle (bumper-to-bumper), Battery, Motor, Controller or Charger — each with its own terms.",
        ],
      },
      {
        heading: "Key fields",
        list: [
          "Start date & months — the coverage window.",
          "Km limit — an optional usage cap.",
          "Battery SoH threshold — for battery warranties, coverage applies if State of Health drops below this %.",
        ],
      },
    ],
  },
  {
    slug: "warranty-claims",
    title: "Warranty Claims",
    area: "Dealership",
    open: "/dms/warranty-claims",
    summary: "Claiming a warranty, from submission to OEM settlement.",
    sections: [
      {
        heading: "The flow",
        list: [
          "Draft → Submitted → Approved / Rejected → Settled.",
          "On submit, eligibility is checked automatically — coverage period, km limit, and for batteries whether SoH dropped below the threshold.",
        ],
      },
      {
        heading: "Eligibility",
        body: [
          "The claim shows an Eligible / Not eligible verdict with the reason — e.g. “battery SoH 72% is below the 80% threshold”. You can still submit, but the verdict guides the OEM decision.",
        ],
      },
    ],
  },
  {
    slug: "subsidy",
    title: "EV Subsidy & Incentives",
    area: "Dealership",
    open: "/dms/subsidy-claims",
    summary: "Government/OEM EV incentives claimed per vehicle sale.",
    sections: [
      {
        heading: "Schemes",
        body: [
          "A Subsidy Scheme is an incentive programme (e.g. FAME-II) that pays a fixed amount per qualifying vehicle.",
        ],
      },
      {
        heading: "Claims",
        list: [
          "Raised per vehicle sale, with the buyer's KYC document attached.",
          "KYC must be verified before you can submit.",
          "Flow: Draft → Submitted → Approved (an e-voucher is generated) → Disbursed.",
        ],
      },
    ],
  },
];

export function getDoc(slug: string) {
  return DOCS.find((d) => d.slug === slug) ?? null;
}

export function docsByArea() {
  return AREAS.map((area) => ({
    area,
    docs: DOCS.filter((d) => d.area === area),
  }));
}
