import { Badge } from "@/components/ui/badge";

export type OrderStatus = "DRAFT" | "TO_FULFILL" | "COMPLETED" | "CANCELLED";

const LABELS: Record<OrderStatus, string> = {
  DRAFT: "Draft",
  TO_FULFILL: "To Fulfil",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

// Status pill for order documents (Purchase Order / Sales Order).
export function OrderStatusBadge({ status }: { status: string }) {
  const s = status as OrderStatus;
  if (s === "COMPLETED")
    return (
      <Badge className="bg-emerald-600 text-white dark:bg-emerald-500">
        {LABELS.COMPLETED}
      </Badge>
    );
  if (s === "TO_FULFILL")
    return (
      <Badge className="bg-amber-500 text-white dark:bg-amber-400">
        {LABELS.TO_FULFILL}
      </Badge>
    );
  if (s === "CANCELLED") return <Badge variant="destructive">{LABELS.CANCELLED}</Badge>;
  return <Badge variant="secondary">{LABELS[s] ?? status}</Badge>;
}
