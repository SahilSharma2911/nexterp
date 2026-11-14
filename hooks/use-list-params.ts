"use client";

import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";

// URL-synced list state shared by every data-table screen: ?page&limit&q&sort.
// clearOnDefault keeps the URL clean (no ?page=1&limit=20 noise).
export function useListParams() {
  return useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(20),
      q: parseAsString.withDefault(""),
      sort: parseAsString.withDefault(""),
    },
    { history: "push", clearOnDefault: true },
  );
}
