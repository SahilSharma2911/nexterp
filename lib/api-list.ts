// Shared, framework-agnostic list contract used by every REST resource.
// Pure types + helpers only (no next/server import) so this is safe to pull
// into client bundles via `import type`.

export type ListParams = {
  page: number;
  limit: number;
  search: string;
  sort: string;
};

export type ListResponse<T> = {
  rows: T[];
  total: number;
  page: number;
  limit: number;
};

// Client-side query shape mirrored into the URL (?page&limit&q&sort).
export type ListQuery = {
  page: number;
  limit: number;
  q: string;
  sort: string;
};

// Parse ?page&limit&q&sort off a URLSearchParams into a normalised shape.
export function parseListParams(sp: URLSearchParams): ListParams {
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit")) || 20));
  const search = (sp.get("q") ?? sp.get("search") ?? "").trim();
  const sort = (sp.get("sort") ?? "").trim();
  return { page, limit, search, sort };
}

// Turn a "field:dir" string into a Prisma orderBy, guarded by an allowlist so
// clients can't sort on arbitrary columns.
export function parseSort(
  sort: string,
  allowed: readonly string[],
  fallback: Record<string, "asc" | "desc">,
): Record<string, "asc" | "desc"> {
  if (!sort) return fallback;
  const [field, dir] = sort.split(":");
  if (!allowed.includes(field)) return fallback;
  return { [field]: dir === "desc" ? "desc" : "asc" };
}
