import { Badge } from "@/components/ui/badge";
import {
  WO_STATUS_LABELS,
  type WorkOrderStatus,
} from "./schema";

export function WorkOrderStatusBadge({ status }: { status: WorkOrderStatus }) {
  const label = WO_STATUS_LABELS[status] ?? status;
  if (status === "COMPLETED")
    return (
      <Badge className="bg-emerald-600 text-white dark:bg-emerald-500">
        {label}
      </Badge>
    );
  if (status === "IN_PROCESS")
    return (
      <Badge className="bg-amber-500 text-white dark:bg-amber-400">
        {label}
      </Badge>
    );
  if (status === "CANCELLED") return <Badge variant="destructive">{label}</Badge>;
  return <Badge variant="secondary">{label}</Badge>;
}
