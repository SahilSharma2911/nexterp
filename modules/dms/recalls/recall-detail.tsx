"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Car,
  CheckCircle2,
  ListChecks,
  Megaphone,
  Pencil,
  Trash2,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DetailHeader, Field } from "@/components/detail/detail-shell";
import { StatCards, type StatItem } from "@/components/analytics/stat-cards";
import { useCanWrite } from "@/components/session-context";
import { cn } from "@/lib/utils";
import { fmtDateTime } from "@/lib/format";
import { RecallStatusBadge, SeverityBadge } from "./columns";
import {
  ITEM_STATUS_LABELS,
  RECALL_ITEM_STATUSES,
  type RecallItemRow,
} from "./schema";
import {
  useRecall,
  useMatchAffected,
  useSetRecallStatus,
  useSetItemStatus,
  useRemoveRecallItem,
  useDeleteRecall,
} from "./queries";

const dash = <span className="text-muted-foreground">—</span>;

function fmtDay(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function RecallDetail({ recallId }: { recallId: string }) {
  const router = useRouter();
  const canWrite = useCanWrite("dms");
  const { data: r, isLoading } = useRecall(recallId);
  const match = useMatchAffected();
  const setStatus = useSetRecallStatus();
  const del = useDeleteRecall();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading || !r) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const busy = match.isPending || setStatus.isPending;
  const isOpen = r.status === "OPEN";

  const stats: StatItem[] = [
    { label: "Affected", value: r.summary.affected, icon: Car },
    { label: "Pending", value: r.summary.pending, icon: ListChecks, tone: r.summary.pending > 0 ? "warning" : undefined },
    { label: "Notified", value: r.summary.notified, icon: Users },
    { label: "Repaired", value: `${r.summary.repaired} (${r.summary.completionPct}%)`, icon: CheckCircle2, tone: "positive" },
  ];

  return (
    <div className="space-y-4">
      <DetailHeader
        icon={Megaphone}
        title={r.code}
        titleMono
        subtitle={r.title}
        badge={
          <span className="flex items-center gap-2">
            <SeverityBadge severity={r.severity} />
            <RecallStatusBadge status={r.status} />
          </span>
        }
        actions={
          canWrite && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dms/recalls/${r.id}/edit`)}
              >
                <Pencil className="size-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => match.mutate({ id: r.id, value: undefined })}
              >
                <Zap className="size-4" />
                {match.isPending ? "Matching…" : "Match affected"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() =>
                  setStatus.mutate({ id: r.id, value: isOpen ? "CLOSED" : "OPEN" })
                }
              >
                {isOpen ? "Close recall" : "Reopen"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            </>
          )
        }
      />

      <StatCards items={stats} />

      {/* Completion bar */}
      <Card>
        <CardContent className="py-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>Remediation progress</span>
            <span className="tabular-nums">
              {r.summary.repaired}/{r.summary.affected} repaired ·{" "}
              {r.summary.completionPct}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${r.summary.completionPct}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Megaphone className="size-4 text-muted-foreground" />
              Campaign
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field icon={Wrench} label="Component" value={r.component ?? dash} />
            <Field
              icon={Car}
              label="Affected models"
              value={r.models.join(", ") || dash}
            />
            <Field
              icon={CalendarClock}
              label="Mfg window"
              value={
                r.mfgFrom || r.mfgTo
                  ? `${fmtDay(r.mfgFrom)} → ${fmtDay(r.mfgTo)}`
                  : "All dates"
              }
            />
            <Field icon={CalendarClock} label="Launched" value={fmtDateTime(r.launchedAt)} />
            {r.closedAt && (
              <Field icon={CalendarClock} label="Closed" value={fmtDateTime(r.closedAt)} />
            )}
            {r.description && (
              <div>
                <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Description
                </p>
                <p className="mt-0.5 text-sm">{r.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Car className="size-4 text-muted-foreground" />
              Affected vehicles ({r.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {r.items.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-muted-foreground">
                No vehicles yet. Add affected models, then use{" "}
                <span className="font-medium">Match affected</span>.
              </p>
            ) : (
              <ul className="divide-y">
                {r.items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    campaignId={r.id}
                    canWrite={canWrite}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {r.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the recall and all {r.items.length} affected-vehicle
              records. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending}
              onClick={(e) => {
                e.preventDefault();
                del.mutate(r.id, {
                  onSuccess: () => router.push("/dms/recalls"),
                });
              }}
            >
              {del.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const ITEM_STATUS_STYLE: Record<string, string> = {
  PENDING: "text-amber-600 dark:text-amber-400",
  NOTIFIED: "text-sky-600 dark:text-sky-400",
  REPAIRED: "text-emerald-600 dark:text-emerald-400",
  NOT_AFFECTED: "text-muted-foreground",
};

function ItemRow({
  item,
  campaignId,
  canWrite,
}: {
  item: RecallItemRow;
  campaignId: string;
  canWrite: boolean;
}) {
  const setItem = useSetItemStatus(campaignId);
  const remove = useRemoveRecallItem(campaignId);

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <Link
          href={`/dms/vehicles/${item.vehicleId}`}
          className="font-mono text-xs font-medium text-primary hover:underline"
        >
          {item.vin}
        </Link>
        <p className="truncate text-xs text-muted-foreground">
          {item.model}
          {item.customerName ? ` · ${item.customerName}` : ""}
          {item.repairedAt ? ` · repaired ${fmtDay(item.repairedAt)}` : ""}
        </p>
      </div>

      {canWrite ? (
        <Select
          value={item.status}
          onValueChange={(v) =>
            setItem.mutate({ itemId: item.id, status: v as RecallItemRow["status"] })
          }
        >
          <SelectTrigger className={cn("h-8 w-[150px] text-xs", ITEM_STATUS_STYLE[item.status])}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RECALL_ITEM_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {ITEM_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <span className={cn("text-xs font-medium", ITEM_STATUS_STYLE[item.status])}>
          {ITEM_STATUS_LABELS[item.status]}
        </span>
      )}

      {canWrite && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
          disabled={remove.isPending}
          onClick={() => remove.mutate(item.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </li>
  );
}
