import { Badge } from "@/components/ui/badge";

export type DocStatus = "DRAFT" | "SUBMITTED" | "CANCELLED";

const LABELS: Record<DocStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  CANCELLED: "Cancelled",
};

// Shared status pill for every transactional document.
export function DocStatusBadge({ status }: { status: string }) {
  const s = status as DocStatus;
  if (s === "SUBMITTED")
    return (
      <Badge className="bg-emerald-600 text-white dark:bg-emerald-500">
        {LABELS.SUBMITTED}
      </Badge>
    );
  if (s === "CANCELLED")
    return <Badge variant="destructive">{LABELS.CANCELLED}</Badge>;
  return <Badge variant="secondary">{LABELS[s] ?? status}</Badge>;
}
