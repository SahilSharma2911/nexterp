"use client";

import { useState } from "react";
import { NewButton } from "@/components/new-button";
import { cn } from "@/lib/utils";
import { ItemsTable } from "@/features/items/items-table";
import { ItemGroupStats } from "@/features/items/item-group-stats";
import {
  SPARE_PART_GROUP,
  ACCESSORY_GROUP,
} from "@/features/items/item-groups";

const TABS = [
  { key: SPARE_PART_GROUP, label: "Spare Parts", newLabel: "New Spare Part" },
  { key: ACCESSORY_GROUP, label: "Accessories", newLabel: "New Accessory" },
];

// One Dealership module for both Spare Parts and Accessories — a segmented
// toggle switches the group; each view is filtered from stock with its own stats.
export function PartsAccessoriesView() {
  const [group, setGroup] = useState<string>(SPARE_PART_GROUP);
  const active = TABS.find((t) => t.key === group) ?? TABS[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border bg-card p-0.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setGroup(t.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                group === t.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <NewButton
          href={`/stock/items/new?group=${encodeURIComponent(group)}`}
          label={active.newLabel}
          area="stock"
        />
      </div>

      {/* key forces a fresh table (resets paging) when switching groups */}
      <ItemGroupStats key={`stats-${group}`} group={group} />
      <ItemsTable key={`table-${group}`} group={group} />
    </div>
  );
}
