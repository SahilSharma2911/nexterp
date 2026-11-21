"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Car,
  ClipboardList,
  FileText,
  Mail,
  MapPin,
  PackageCheck,
  Pencil,
  Phone,
  Receipt,
  Trash2,
  Truck,
  User,
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
import { fmtMoney, fmtDateTime } from "@/lib/format";
import { StatusBadge } from "@/modules/dms/vehicles/columns";
import { ALLOCATION_STATUS_LABELS } from "@/modules/dms/allocation/schema";
import type { DealerDemandRow, DealerVehicleRow } from "./schema";
import { useDealerDetail, useDeleteDealer } from "./queries";

function compactMoney(v: number) {
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  return fmtMoney(v);
}

const PRIORITY_LABEL: Record<number, string> = {
  1: "High",
  2: "Normal",
  3: "Low",
};

const dash = <span className="text-muted-foreground">—</span>;

export function DealerDetail({ dealerId }: { dealerId: string }) {
  const router = useRouter();
  const canWrite = useCanWrite("dms");
  const { data: d, isLoading } = useDealerDetail(dealerId);
  const del = useDeleteDealer();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading || !d) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const address = [
    d.addressLine1,
    d.addressLine2,
    [d.city, d.state].filter(Boolean).join(", "),
    [d.postalCode, d.country].filter(Boolean).join(" "),
  ].filter(Boolean);

  const stats: StatItem[] = [
    {
      label: "Vehicles assigned",
      value: d.assigned,
      icon: Car,
    },
    {
      label: "Delivered",
      value: d.delivered,
      icon: PackageCheck,
      tone: "positive",
      sub: `${compactMoney(d.deliveredValue)} sold`,
    },
    {
      label: "In pipeline",
      value: d.pipeline,
      icon: Truck,
      sub: "allocated · in transit · at dealer",
    },
    {
      label: "Open demand",
      value: d.openDemand,
      icon: ClipboardList,
      tone: d.openDemand > 0 ? "warning" : undefined,
      sub: "units requested",
    },
  ];

  return (
    <div className="space-y-4">
      <DetailHeader
        icon={Building2}
        imageUrl={d.logoUrl}
        title={d.name}
        subtitle={d.code}
        badge={
          d.disabled ? (
            <Badge variant="secondary">Disabled</Badge>
          ) : (
            <Badge>Active</Badge>
          )
        }
        stats={[
          {
            label: "Vehicles",
            value: (
              <Link
                href={`/dms/vehicles?dealer=${d.id}`}
                className="text-primary hover:underline"
              >
                {d.assigned}
              </Link>
            ),
          },
        ]}
        actions={
          canWrite && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href={`/dms/dealers/${d.id}/edit`}>
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field
              icon={User}
              label="Contact person"
              value={d.contactPerson ?? dash}
            />
            <Field icon={Phone} label="Phone" value={d.phone ?? dash} />
            <Field icon={Mail} label="Email" value={d.email ?? dash} />
            <Field
              icon={FileText}
              label="Legal name"
              value={d.legalName ?? dash}
            />
            <Field
              icon={Receipt}
              label="GSTIN / Tax ID"
              value={d.gstin ?? dash}
            />
            <Field
              icon={Car}
              label="Vehicles assigned"
              value={
                <Link
                  href={`/dms/vehicles?dealer=${d.id}`}
                  className="text-primary hover:underline"
                >
                  {d.assigned}
                </Link>
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            {address.length ? (
              <address className="text-sm leading-relaxed not-italic">
                {address.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </address>
            ) : (
              dash
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryBarChart
          title="Vehicles by lifecycle stage"
          data={d.byStatus}
          emptyMessage="No vehicles assigned yet."
        />
        <TrendChart
          title="Deliveries · last 6 months"
          data={d.deliveriesByMonth}
        />
      </div>

      <OpenDemand rows={d.demand} />

      <RecentVehicles dealerId={d.id} rows={d.recentVehicles} />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {d.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the dealer. Dealers with vehicles assigned
              can&apos;t be deleted — disable them instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending}
              onClick={(e) => {
                e.preventDefault();
                del.mutate(d.id, {
                  onSuccess: () => {
                    setConfirmOpen(false);
                    router.push("/dms/dealers");
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

function OpenDemand({ rows }: { rows: DealerDemandRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <ClipboardList className="size-4 text-muted-foreground" />
          Open allocation demand
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <p className="px-6 pb-5 text-sm text-muted-foreground">
            No pending allocation requests.
          </p>
        ) : (
          <ul className="divide-y">
            {rows.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm"
              >
                <Link
                  href="/dms/allocation"
                  className="font-mono text-xs text-primary hover:underline"
                >
                  {a.name}
                </Link>
                <span className="font-medium">
                  {[a.model, a.variant].filter(Boolean).join(" ")}
                </span>
                <Badge variant="outline" className="text-muted-foreground">
                  {ALLOCATION_STATUS_LABELS[a.status]}
                </Badge>
                {a.priority === 1 && (
                  <Badge className="bg-red-500/15 text-red-600 dark:text-red-400">
                    {PRIORITY_LABEL[a.priority]} priority
                  </Badge>
                )}
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {a.qtyAllocated}/{a.qty} allocated ·{" "}
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    {Math.max(0, a.qty - a.qtyAllocated)} pending
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function RecentVehicles({
  dealerId,
  rows,
}: {
  dealerId: string;
  rows: DealerVehicleRow[];
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Car className="size-4 text-muted-foreground" />
          Recent vehicles
        </CardTitle>
        <Link
          href={`/dms/vehicles?dealer=${dealerId}`}
          className="text-xs text-primary hover:underline"
        >
          View all →
        </Link>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {rows.length === 0 ? (
          <p className="px-6 pb-5 text-sm text-muted-foreground">
            No vehicles assigned to this dealer yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y text-left text-xs text-muted-foreground">
                <th className="p-3 font-medium">VIN</th>
                <th className="p-3 font-medium">Model</th>
                <th className="p-3 font-medium">Stage</th>
                <th className="p-3 text-right font-medium">Selling price</th>
                <th className="p-3 text-right font-medium">Delivered</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id} className="border-b last:border-0">
                  <td className="p-3">
                    <Link
                      href={`/dms/vehicles/${v.id}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {v.vin}
                    </Link>
                  </td>
                  <td className="p-3">
                    {[v.model, v.variant].filter(Boolean).join(" ")}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {fmtMoney(v.sellingRate)}
                  </td>
                  <td className="p-3 text-right text-muted-foreground tabular-nums">
                    {v.deliveredAt ? fmtDateTime(v.deliveredAt) : dash}
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
