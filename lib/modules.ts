// Vertical module registry.
//
// The core (auth, RBAC, inventory engine, accounting engine, dashboard, docs)
// is always on. Verticals ("packs") sit on top and can be toggled per
// deployment, so the same source produces different application products:
//   ENABLED_MODULES="erp"       → a plain ERP
//   ENABLED_MODULES="erp,dms"   → ERP + EV dealership
//   ENABLED_MODULES="dms"       → a standalone dealer management system
//
// Pure + edge-safe (no imports) so middleware, server and client can all read
// it. Uses a NEXT_PUBLIC_ var so the client bundle (sidebar, gating) sees the
// same answer as the server.

export type ModuleId = "erp" | "dms";

export type ModuleMeta = {
  id: ModuleId;
  label: string;
  description: string;
};

export const MODULES: ModuleMeta[] = [
  {
    id: "erp",
    label: "ERP",
    description: "Inventory, manufacturing, buying, selling and accounting",
  },
  {
    id: "dms",
    label: "Dealership",
    description: "EV vehicles, dealers, service and warranty",
  },
];

const ALL: ModuleId[] = ["erp", "dms"];

function parseEnabled(): Set<ModuleId> {
  const raw = process.env.NEXT_PUBLIC_ENABLED_MODULES?.trim();
  const ids = raw
    ? raw
        .split(",")
        .map((s) => s.trim())
        .filter((s): s is ModuleId => (ALL as string[]).includes(s))
    : // Default: both on (dev). Tighten per deployment via the env var.
      ALL;
  return new Set(ids.length ? ids : ALL);
}

const ENABLED = parseEnabled();

export function isModuleEnabled(id: ModuleId): boolean {
  return ENABLED.has(id);
}

export function enabledModules(): ModuleMeta[] {
  return MODULES.filter((m) => ENABLED.has(m.id));
}
