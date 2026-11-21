import { ItemArt } from "@/components/item-art";

// Friendly empty table / list placeholder with a small product cutout.
export function EmptyState({ message }: { message: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 p-2 dark:from-blue-500/15 dark:to-indigo-500/10">
        <ItemArt kind="box" />
      </span>
      <p className="text-sm font-semibold text-foreground">{message}</p>
      <p className="text-xs text-muted-foreground">
        Try a different search or filter, or add a new record.
      </p>
    </div>
  );
}
