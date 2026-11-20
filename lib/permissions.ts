// Simple role-per-user access model. Pure (edge-safe) — no imports.

export type Role = "ADMIN" | "STOCK" | "BUYING" | "SELLING" | "ACCOUNTS" | "VIEWER";
export type Area =
  | "stock"
  | "manufacturing"
  | "buying"
  | "selling"
  | "accounts"
  | "dms";

export const ROLE_VALUES = [
  "ADMIN",
  "STOCK",
  "BUYING",
  "SELLING",
  "ACCOUNTS",
  "VIEWER",
] as const;

export const ROLES: { value: Role; label: string; hint: string }[] = [
  { value: "ADMIN", label: "Admin", hint: "Full access + user management" },
  { value: "STOCK", label: "Stock", hint: "Stock & manufacturing" },
  { value: "BUYING", label: "Buying", hint: "Purchasing" },
  { value: "SELLING", label: "Selling", hint: "Sales" },
  { value: "ACCOUNTS", label: "Accounts", hint: "Invoices, payments, ledgers" },
  { value: "VIEWER", label: "Viewer", hint: "Read-only everywhere" },
];

// Areas a role can WRITE (create / edit / submit / cancel / delete).
const WRITE: Record<Role, Area[] | "all"> = {
  ADMIN: "all",
  STOCK: ["stock", "manufacturing"],
  BUYING: ["buying"],
  SELLING: ["selling"],
  ACCOUNTS: ["accounts"],
  VIEWER: [],
};

// Areas shown in the sidebar for a role (everyone also gets Dashboard + Docs).
const NAV: Record<Role, Area[] | "all"> = {
  ADMIN: "all",
  VIEWER: "all",
  STOCK: ["stock", "manufacturing"],
  BUYING: ["buying", "stock"],
  SELLING: ["selling", "stock"],
  ACCOUNTS: ["accounts", "buying", "selling"],
};

export function canWrite(role: Role, area: Area): boolean {
  const w = WRITE[role];
  return w === "all" || w.includes(area);
}

export function canSeeNav(role: Role, area: Area): boolean {
  const n = NAV[role];
  return n === "all" || n.includes(area);
}

export const isAdmin = (role: Role) => role === "ADMIN";

// Admin-only sections (user management). Fully gated — non-admins can neither
// read nor write here.
export function isAdminOnlyPath(path: string): boolean {
  return path.startsWith("/settings") || path.startsWith("/api/users");
}

// Map a request path to its area (for write-gating). null = no area gate.
export function areaForPath(path: string): Area | null {
  if (path.startsWith("/stock")) return "stock";
  if (path.startsWith("/manufacturing")) return "manufacturing";
  if (path.startsWith("/buying")) return "buying";
  if (path.startsWith("/selling")) return "selling";
  if (path.startsWith("/accounts")) return "accounts";
  if (path.startsWith("/dms")) return "dms";

  const apiMap: [string, Area][] = [
    ["/api/vehicles", "dms"],
    ["/api/dealers", "dms"],
    ["/api/allocation", "dms"],
    ["/api/technicians", "dms"],
    ["/api/service-bays", "dms"],
    ["/api/service-appointments", "dms"],
    ["/api/job-cards", "dms"],
    ["/api/warranties", "dms"],
    ["/api/warranty-claims", "dms"],
    ["/api/subsidy-schemes", "dms"],
    ["/api/subsidy-claims", "dms"],
    ["/api/items", "stock"],
    ["/api/warehouses", "stock"],
    ["/api/stock-entries", "stock"],
    ["/api/stock-reconciliations", "stock"],
    ["/api/boms", "manufacturing"],
    ["/api/work-orders", "manufacturing"],
    ["/api/suppliers", "buying"],
    ["/api/purchase-orders", "buying"],
    ["/api/purchase-receipts", "buying"],
    ["/api/customers", "selling"],
    ["/api/sales-orders", "selling"],
    ["/api/delivery-notes", "selling"],
    ["/api/accounts", "accounts"],
    ["/api/sales-invoices", "accounts"],
    ["/api/purchase-invoices", "accounts"],
    ["/api/payment-entries", "accounts"],
  ];
  for (const [prefix, area] of apiMap) if (path.startsWith(prefix)) return area;
  return null;
}
