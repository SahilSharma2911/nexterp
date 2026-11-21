"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Activity,
  BadgeCheck,
  BatteryCharging,
  Car,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Cpu,
  FileText,
  Gauge,
  Package,
  Palette,
  Pencil,
  Plus,
  Timer,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DetailHeader } from "@/components/detail/detail-shell";
import {
  AssignResourcesDialog,
  AssignNotice,
} from "@/components/dms/assign-resources-dialog";
import { useCanWrite, useSession } from "@/components/session-context";
import { cn } from "@/lib/utils";
import { fmtMoney, fmtQty, fmtRate, fmtDateTime } from "@/lib/format";
import { useVehicle } from "@/modules/dms/vehicles/queries";
import { JobStatusBadge } from "./columns";
import type { JobCardDetail as JobCard } from "./schema";
import {
  useApproveJobCard,
  useAssignJobCard,
  useCancelJobCard,
  useCompleteJobCard,
  useDeleteJobCard,
  useJobCard,
  useRecordJobCardQc,
} from "./queries";

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

function fmtDuration(ms: number) {
  const m = Math.max(0, Math.round(ms / 60000));
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const min = m % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${min}m`;
  return `${min}m`;
}

export function JobCardDetail({ jobId }: { jobId: string }) {
  const router = useRouter();
  const canWrite = useCanWrite("dms");
  const session = useSession();
  const { data: j, isLoading } = useJobCard(jobId);
  const complete = useCompleteJobCard();
  const cancel = useCancelJobCard();
  const del = useDeleteJobCard();
  const approve = useApproveJobCard();
  const assign = useAssignJobCard();
  const qc = useRecordJobCardQc(jobId);
  const [confirm, setConfirm] = useState<null | "cancel" | "delete">(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [qcOpen, setQcOpen] = useState(false);
  const [qcBy, setQcBy] = useState("");
  const [qcNote, setQcNote] = useState("");

  if (isLoading || !j) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-9 w-96" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const isEstimate = j.status === "ESTIMATE";
  const isOpen = j.status === "OPEN";
  const isCompleted = j.status === "COMPLETED";
  const assignable = isEstimate || isOpen;
  const unassigned = assignable && (!j.bayId || !j.technicianId);
  const missing = !j.bayId && !j.technicianId
    ? "No technician or service bay assigned yet."
    : !j.technicianId
      ? "No technician assigned yet."
      : "No service bay assigned yet.";

  return (
    <div className="space-y-4">
      <DetailHeader
        icon={Wrench}
        title={j.name}
        titleMono
        subtitle={`${j.vehicle} · ${j.vehicleModel}`}
        badge={
          <div className="flex items-center gap-2">
            {j.isHV && (
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
                HV
              </Badge>
            )}
            <JobStatusBadge status={j.status} />
          </div>
        }
        stats={[{ label: "Total", value: fmtMoney(j.total) }]}
        actions={
          <>
            {canWrite && assignable && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAssignOpen(true)}
                >
                  <Wrench className="size-4" />
                  Assign
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dms/job-cards/${j.id}/edit`}>
                    <Pencil className="size-4" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setConfirm("delete")}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </>
            )}
            {canWrite && isEstimate && (
              <Button
                size="sm"
                disabled={approve.isPending}
                onClick={() =>
                  approve.mutate({ id: j.id, approvedBy: session.name })
                }
              >
                <BadgeCheck className="size-4" />
                {approve.isPending ? "Approving…" : "Approve estimate"}
              </Button>
            )}
            {canWrite && isOpen && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQcBy(j.qcBy ?? "");
                    setQcNote(j.qcNote ?? "");
                    setQcOpen(true);
                  }}
                >
                  <ClipboardCheck className="size-4" />
                  {j.qcAt ? "QC ✓" : "Record QC"}
                </Button>
                <Button
                  size="sm"
                  disabled={complete.isPending}
                  onClick={() => complete.mutate(j.id)}
                >
                  <CheckCircle2 className="size-4" />
                  {complete.isPending ? "Completing…" : "Complete"}
                </Button>
              </>
            )}
            {canWrite && isCompleted && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirm("cancel")}
              >
                Cancel Job
              </Button>
            )}
          </>
        }
      />

      {unassigned && (
        <AssignNotice
          label={missing}
          onAssign={() => setAssignOpen(true)}
          disabled={!canWrite}
        />
      )}

      {assignOpen && (
        <AssignResourcesDialog
          isHV={j.isHV}
          bayId={j.bayId}
          technicianId={j.technicianId}
          saving={assign.isPending}
          onOpenChange={setAssignOpen}
          onSave={(vals) =>
            assign.mutate(
              { id: j.id, ...vals },
              { onSuccess: () => setAssignOpen(false) },
            )
          }
        />
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
        <DetailsTab j={j} className="lg:col-span-4" />
        <ProgressCard j={j} className="lg:col-span-2" />

        <PartsTab j={j} className="lg:col-span-4" />
        <TimeTrackingCard j={j} className="lg:col-span-2" />

        <LabourTab j={j} className="lg:col-span-4" />
        <ActivityCard j={j} className="lg:col-span-2 lg:row-span-2" />

        <QualityTab
          j={j}
          canWrite={canWrite && isOpen}
          onRecord={() => {
            setQcBy(j.qcBy ?? "");
            setQcNote(j.qcNote ?? "");
            setQcOpen(true);
          }}
          className="lg:col-span-2"
        />
        <NotesTab j={j} className="lg:col-span-2" />

        <VehicleHealth vehicleId={j.vehicleId} className="lg:col-span-6" />
      </div>

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === "delete" ? `Delete ${j.name}?` : `Cancel ${j.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "delete"
                ? `This permanently deletes the ${isEstimate ? "estimate" : "open job card"}.`
                : "This reverses the issued parts (stock ledger) and the posted revenue (GL). This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending || cancel.isPending}
              onClick={(ev) => {
                ev.preventDefault();
                if (confirm === "delete") {
                  del.mutate(j.id, {
                    onSuccess: () => {
                      setConfirm(null);
                      router.push("/dms/job-cards");
                    },
                  });
                } else {
                  cancel.mutate(j.id, { onSuccess: () => setConfirm(null) });
                }
              }}
            >
              {confirm === "delete" ? "Delete" : "Cancel Job"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={qcOpen} onOpenChange={setQcOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record quality check</DialogTitle>
            <DialogDescription>
              Sign off the workshop quality check before completing the job.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="qc-by">Checked by</Label>
              <Input
                id="qc-by"
                value={qcBy}
                onChange={(e) => setQcBy(e.target.value)}
                placeholder="Inspector name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qc-note">Note (optional)</Label>
              <Textarea
                id="qc-note"
                value={qcNote}
                onChange={(e) => setQcNote(e.target.value)}
                placeholder="Observations, re-work needed, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQcOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={qc.isPending || !qcBy.trim()}
              onClick={() =>
                qc.mutate({ qcBy, qcNote }, { onSuccess: () => setQcOpen(false) })
              }
            >
              {qc.isPending ? "Saving…" : "Record QC"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const dash = <span className="text-muted-foreground">—</span>;

function DetailsTab({ j, className }: { j: JobCard; className?: string }) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="size-4 text-muted-foreground" />
          Job detail
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Meta
          label="Vehicle"
          value={
            <Link
              href={`/dms/vehicles/${j.vehicleId}`}
              className="font-mono text-xs text-primary hover:underline"
            >
              {j.vehicle}
            </Link>
          }
        />
        <Meta label="Parts warehouse" value={j.warehouse ?? dash} />
        <Meta
          label="Technician"
          value={j.technicianName ?? j.technician ?? dash}
        />
        <Meta label="Service bay" value={j.bayName ?? dash} />
        <Meta
          label="Odometer"
          value={j.odometer != null ? `${j.odometer} km` : dash}
        />
        <Meta label="Service date" value={fmtDateTime(j.serviceDate)} />
        <Meta label="Work type" value={j.isHV ? "High-voltage" : "Standard"} />
        {j.appointmentId && j.appointmentName ? (
          <Meta
            label="From appointment"
            value={
              <Link
                href={`/dms/service-appointments/${j.appointmentId}`}
                className="text-primary hover:underline"
              >
                {j.appointmentName}
              </Link>
            }
          />
        ) : (
          <Meta label="From appointment" value={dash} />
        )}
        {j.complaint && (
          <div className="sm:col-span-2 lg:col-span-3">
            <Meta label="Complaint" value={j.complaint} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProgressCard({ j, className }: { j: JobCard; className?: string }) {
  const steps = ["Opened", "Quality check", "Completed"];
  let current = 0;
  if (j.qcAt) current = 1;
  if (j.status === "COMPLETED") current = 2;
  const cancelled = j.status === "CANCELLED";
  const pct = cancelled ? 100 : Math.round((current / (steps.length - 1)) * 100);

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-4 text-muted-foreground" />
          Job progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              cancelled ? "bg-destructive" : "bg-primary",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        {cancelled ? (
          <Badge variant="destructive">Cancelled</Badge>
        ) : (
          <ol className="flex flex-wrap items-center gap-1 text-xs">
            {steps.map((s, i) => (
              <li key={s} className="flex items-center gap-1">
                <span
                  className={cn(
                    "rounded px-2 py-1 font-medium",
                    i === current
                      ? "bg-primary text-primary-foreground"
                      : i < current
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {s}
                </span>
                {i < steps.length - 1 && (
                  <span className="text-muted-foreground">→</span>
                )}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function TimeTrackingCard({ j, className }: { j: JobCard; className?: string }) {
  const estHours = j.labor.reduce((s, l) => s + l.hours, 0);
  const endIso = j.completedAt ?? j.cancelledAt;
  const open = !endIso;
  const turnaround = endIso
    ? fmtDuration(+new Date(endIso) - +new Date(j.createdAt))
    : null;

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" />
          Time tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        <Meta label="Estimated labour" value={`${fmtQty(estHours)} h`} />
        <Meta
          label={open ? "Opened" : "Turnaround"}
          value={open ? fmtDateTime(j.createdAt) : turnaround}
        />
        <Meta
          label="Status"
          value={
            open
              ? "In workshop"
              : j.status === "COMPLETED"
                ? "Delivered"
                : "Cancelled"
          }
        />
      </CardContent>
    </Card>
  );
}

function ActivityCard({ j, className }: { j: JobCard; className?: string }) {
  const events = [
    { label: "Job card opened", at: j.createdAt, icon: Plus },
    j.approvedAt
      ? { label: `Estimate approved${j.approvedBy ? ` · ${j.approvedBy}` : ""}`, at: j.approvedAt, icon: BadgeCheck }
      : null,
    j.qcAt
      ? { label: `Quality check${j.qcBy ? ` · ${j.qcBy}` : ""}`, at: j.qcAt, icon: ClipboardCheck }
      : null,
    j.completedAt
      ? { label: "Completed — parts issued & billed", at: j.completedAt, icon: CheckCircle2 }
      : null,
    j.cancelledAt
      ? { label: "Cancelled — stock & ledger reversed", at: j.cancelledAt, icon: X }
      : null,
  ]
    .filter((e): e is { label: string; at: string; icon: typeof Plus } => !!e)
    .sort((a, b) => +new Date(a.at) - +new Date(b.at));

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-4 text-muted-foreground" />
          Activity timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-4 border-l pl-6">
          {events.map((e, i) => {
            const Icon = e.icon;
            return (
              <li key={i} className="relative">
                <span className="absolute -left-[31px] flex size-6 items-center justify-center rounded-full border bg-background text-muted-foreground">
                  <Icon className="size-3.5" />
                </span>
                <p className="text-sm font-medium">{e.label}</p>
                <p className="text-xs text-muted-foreground">
                  {fmtDateTime(e.at)}
                </p>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

function PartsTab({ j, className }: { j: JobCard; className?: string }) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="size-4 text-muted-foreground" />
          Parts consumption
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {j.parts.length === 0 ? (
          <p className="px-6 pb-5 text-sm text-muted-foreground">
            No parts on this job.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y text-left text-xs text-muted-foreground">
                <th className="p-3 font-medium">Part</th>
                <th className="p-3 text-right font-medium">Qty</th>
                <th className="p-3 text-right font-medium">Rate</th>
                <th className="p-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {j.parts.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-3">
                    <Link
                      href={`/stock/items/${p.itemId}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {p.itemCode}
                    </Link>
                    <span className="ml-2 text-muted-foreground">
                      {p.itemName}
                    </span>
                  </td>
                  <td className="p-3 text-right tabular-nums">{fmtQty(p.qty)}</td>
                  <td className="p-3 text-right tabular-nums">{fmtRate(p.rate)}</td>
                  <td className="p-3 text-right tabular-nums">{fmtMoney(p.amount)}</td>
                </tr>
              ))}
              <tr className="border-t">
                <td
                  className="p-3 text-right text-xs font-semibold text-muted-foreground uppercase"
                  colSpan={3}
                >
                  Parts total
                </td>
                <td className="p-3 text-right font-semibold tabular-nums">
                  {fmtMoney(j.partsTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function LabourTab({ j, className }: { j: JobCard; className?: string }) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="size-4 text-muted-foreground" />
          Labour
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {j.labor.length === 0 ? (
          <p className="px-6 pb-5 text-sm text-muted-foreground">
            No labour lines.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y text-left text-xs text-muted-foreground">
                <th className="p-3 font-medium">Work</th>
                <th className="p-3 text-right font-medium">Hours</th>
                <th className="p-3 text-right font-medium">Rate</th>
                <th className="p-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {j.labor.map((l) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="p-3">{l.description}</td>
                  <td className="p-3 text-right tabular-nums">{fmtQty(l.hours)}</td>
                  <td className="p-3 text-right tabular-nums">{fmtMoney(l.rate)}</td>
                  <td className="p-3 text-right tabular-nums">{fmtMoney(l.amount)}</td>
                </tr>
              ))}
              <tr className="border-t">
                <td
                  className="p-3 text-right text-xs font-semibold text-muted-foreground uppercase"
                  colSpan={3}
                >
                  Labour total
                </td>
                <td className="p-3 text-right font-semibold tabular-nums">
                  {fmtMoney(j.laborTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function QualityTab({
  j,
  canWrite,
  onRecord,
  className,
}: {
  j: JobCard;
  canWrite: boolean;
  onRecord: () => void;
  className?: string;
}) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="size-4 text-muted-foreground" />
          Quality check
        </CardTitle>
        {canWrite && (
          <Button variant="outline" size="sm" onClick={onRecord}>
            <ClipboardCheck className="size-4" />
            {j.qcAt ? "Update QC" : "Record QC"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {j.qcAt ? (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <span>
              <span className="font-semibold">Signed off</span> by {j.qcBy} ·{" "}
              {fmtDateTime(j.qcAt)}
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Quality check not recorded yet.
          </p>
        )}
        {j.qcNote && <Meta label="QC note" value={j.qcNote} />}
      </CardContent>
    </Card>
  );
}

function NotesTab({ j, className }: { j: JobCard; className?: string }) {
  return (
    <div className={cn("flex h-full flex-col gap-4", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {j.remarks ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {j.remarks}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No notes.</p>
          )}
        </CardContent>
      </Card>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            Attachments ({j.photos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {j.photos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attachments.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {j.photos.map((p, i) => (
                <a
                  key={`${p}-${i}`}
                  href={p}
                  target="_blank"
                  rel="noreferrer"
                  className="relative size-28 overflow-hidden rounded-lg border bg-muted"
                >
                  <Image
                    src={p}
                    alt={`Attachment ${i + 1}`}
                    fill
                    sizes="112px"
                    className="object-cover"
                    unoptimized
                  />
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function sohClass(soh: number) {
  if (soh >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (soh >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function VehicleHealth({
  vehicleId,
  className,
}: {
  vehicleId: string;
  className?: string;
}) {
  const { data: v, isLoading } = useVehicle(vehicleId);

  if (isLoading)
    return <Skeleton className={cn("h-48 w-full rounded-xl", className)} />;
  if (!v) return null;

  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="size-4 text-muted-foreground" />
            Vehicle health overview
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1 flex flex-col items-center justify-center rounded-lg border bg-muted/30 p-4">
            <BatteryCharging className="size-6 text-primary" />
            <p
              className={cn(
                "mt-1 text-3xl font-semibold tabular-nums",
                v.batterySoH != null ? sohClass(v.batterySoH) : "",
              )}
            >
              {v.batterySoH != null ? `${v.batterySoH}%` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Battery SoH</p>
          </div>
          <Meta label="Motor serial" value={v.motorSerial ?? dash} />
          <Meta label="Battery serial" value={v.batterySerial ?? dash} />
          <Meta
            label="Model"
            value={[v.model, v.variant].filter(Boolean).join(" · ")}
          />
          <Meta
            label="Colour"
            value={
              v.color ? (
                <span className="flex items-center gap-1.5">
                  <Palette className="size-3.5 text-muted-foreground" />
                  {v.color}
                </span>
              ) : (
                dash
              )
            }
          />
          <Meta
            label="Odometer basis"
            value={
              <span className="flex items-center gap-1.5">
                <Gauge className="size-3.5 text-muted-foreground" />
                {v.model}
              </span>
            }
          />
          <Meta
            label="Powertrain"
            value={
              <span className="flex items-center gap-1.5">
                <Cpu className="size-3.5 text-muted-foreground" />
                Electric
              </span>
            }
          />
        </CardContent>
      </Card>

      {v.specifications && v.specifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Specifications</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {v.specifications.map((s, i) => (
              <Meta key={i} label={s.label} value={s.value || dash} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
