"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  HardHat,
  IndianRupee,
  Pencil,
  Phone,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { CategoryBarChart } from "@/components/analytics/category-bar-chart";
import { TrendChart } from "@/components/analytics/trend-chart";
import { useCanWrite } from "@/components/session-context";
import { cn } from "@/lib/utils";
import { fmtMoney, fmtDateTime } from "@/lib/format";
import { JobStatusBadge } from "@/modules/dms/job-cards/columns";
import type { TechnicianJobRow } from "./schema";
import { useTechnicianDetail, useDeleteTechnician } from "./queries";

function compactMoney(v: number) {
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  return fmtMoney(v);
}

function fmtTurnaround(hours: number | null) {
  if (hours == null) return "—";
  if (hours >= 48) return `${(hours / 24).toFixed(1)}d`;
  return `${hours.toFixed(1)}h`;
}

const dash = <span className="text-muted-foreground">—</span>;

export function TechnicianDetail({ technicianId }: { technicianId: string }) {
  const router = useRouter();
  const canWrite = useCanWrite("dms");
  const { data: t, isLoading } = useTechnicianDetail(technicianId);
  const del = useDeleteTechnician();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading || !t) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const stats: StatItem[] = [
    {
      label: "Open jobs",
      value: t.openJobs,
      icon: Wrench,
      tone: t.openJobs > 0 ? "warning" : undefined,
      sub: `${t.totalJobs} total handled`,
    },
    {
      label: "Completed",
      value: t.completedJobs,
      icon: CheckCircle2,
      tone: "positive",
      sub: `${t.hvJobs} high-voltage`,
    },
    {
      label: "Revenue generated",
      value: compactMoney(t.revenue),
      icon: IndianRupee,
      sub: `${compactMoney(t.partsValue)} parts · ${compactMoney(t.laborValue)} labour`,
    },
    {
      label: "Avg turnaround",
      value: fmtTurnaround(t.avgTurnaroundHours),
      icon: Clock,
      sub: "open → completed",
    },
  ];

  return (
    <div className="space-y-4">
      <DetailHeader
        icon={HardHat}
        title={t.name}
        subtitle="Technician"
        badge={
          <div className="flex items-center gap-2">
            {t.isHVCertified && (
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
                HV certified
              </Badge>
            )}
            {t.active ? (
              <Badge>Active</Badge>
            ) : (
              <Badge variant="secondary">Inactive</Badge>
            )}
          </div>
        }
        stats={[
          { label: "Job cards", value: t.totalJobs },
          { label: "Revenue", value: compactMoney(t.revenue) },
        ]}
        actions={
          canWrite && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href={`/dms/technicians/${t.id}/edit`}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            </>
          )
        }
      />

      <StatCards items={stats} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
        {/* Profile */}
        <Card className="h-full lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardHat className="size-4 text-muted-foreground" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field icon={Phone} label="Phone" value={t.phone ?? dash} />
            <Field
              icon={CalendarDays}
              label="Joined"
              value={fmtDateTime(t.createdAt)}
            />
            <Field
              icon={Wrench}
              label="Appointments"
              value={t.appointments}
            />
            <Field
              icon={HardHat}
              label="Status"
              value={t.active ? "Active" : "Inactive"}
            />
          </CardContent>
        </Card>

        {/* Skills */}
        <Card className="h-full lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-muted-foreground" />
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            {t.skillTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {t.skillTags.map((s) => (
                  <Badge
                    key={s}
                    variant="secondary"
                    className="bg-primary/10 text-primary"
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No skills recorded.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Certification */}
        <Card className="h-full lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-muted-foreground" />
              Certification
            </CardTitle>
          </CardHeader>
          <CardContent className="flex h-[calc(100%-4rem)] flex-col items-center justify-center gap-1">
            <Zap
              className={cn(
                "size-7",
                t.isHVCertified ? "text-amber-500" : "text-muted-foreground",
              )}
            />
            <p className="text-lg font-semibold">
              {t.isHVCertified ? "HV certified" : "Standard"}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.isHVCertified
                ? `cleared for high-voltage · ${t.hvJobs} HV jobs done`
                : "not cleared for high-voltage work"}
            </p>
          </CardContent>
        </Card>

        {/* Personal completion trend */}
        <div className="lg:col-span-3">
          <TrendChart
            title="Completions · last 6 months"
            data={t.completionsByMonth}
          />
        </div>

        {/* Status breakdown */}
        <div className="lg:col-span-3">
          <CategoryBarChart
            title="Jobs by status"
            data={t.statusBreakdown}
            emptyMessage="No jobs yet."
          />
        </div>

        {/* Recent jobs */}
        <RecentJobs className="lg:col-span-6" rows={t.recentJobs} />
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {t.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Technicians referenced by job cards or appointments can&apos;t be
              deleted — mark them inactive instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending}
              onClick={(e) => {
                e.preventDefault();
                del.mutate(t.id, {
                  onSuccess: () => {
                    setConfirmOpen(false);
                    router.push("/dms/technicians");
                  },
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

function RecentJobs({
  rows,
  className,
}: {
  rows: TechnicianJobRow[];
  className?: string;
}) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Wrench className="size-4 text-muted-foreground" />
          Recent job cards
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {rows.length === 0 ? (
          <p className="px-6 pb-5 text-sm text-muted-foreground">
            No job cards assigned yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y text-left text-xs text-muted-foreground">
                <th className="p-3 font-medium">Job</th>
                <th className="p-3 font-medium">Vehicle</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 text-right font-medium">Total</th>
                <th className="p-3 text-right font-medium">Service date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((j) => (
                <tr key={j.id} className="border-b last:border-0">
                  <td className="p-3">
                    <Link
                      href={`/dms/job-cards/${j.id}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {j.name}
                    </Link>
                    {j.isHV && (
                      <Badge className="ml-2 bg-amber-500/15 text-amber-700 dark:text-amber-400">
                        HV
                      </Badge>
                    )}
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/dms/vehicles/${j.vehicleId}`}
                      className="text-primary hover:underline"
                    >
                      {j.vin}
                    </Link>
                    <span className="ml-2 text-muted-foreground">
                      {j.model}
                    </span>
                  </td>
                  <td className="p-3">
                    <JobStatusBadge status={j.status} />
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {fmtMoney(j.total)}
                  </td>
                  <td className="p-3 text-right text-muted-foreground tabular-nums">
                    {fmtDateTime(j.serviceDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
