"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { PageHeader } from "@/components/page-header";
import { useCanWrite } from "@/components/session-context";
import { fmtMoney, fmtQty, fmtRate, fmtDateTime } from "@/lib/format";
import { JobStatusBadge } from "./columns";
import {
  useCancelJobCard,
  useCompleteJobCard,
  useDeleteJobCard,
  useJobCard,
} from "./queries";

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

export function JobCardDetail({ jobId }: { jobId: string }) {
  const router = useRouter();
  const canWrite = useCanWrite("dms");
  const { data: j, isLoading } = useJobCard(jobId);
  const complete = useCompleteJobCard();
  const cancel = useCancelJobCard();
  const del = useDeleteJobCard();
  const [confirm, setConfirm] = useState<null | "cancel" | "delete">(null);

  if (isLoading || !j) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const dash = <span className="text-muted-foreground">—</span>;
  const isOpen = j.status === "OPEN";
  const isCompleted = j.status === "COMPLETED";

  return (
    <div className="space-y-6">
      <PageHeader
        title={j.name}
        subtitle={`${j.vehicle} · ${j.vehicleModel}`}
        actions={
          <div className="flex items-center gap-2">
            <JobStatusBadge status={j.status} />
            {canWrite && isOpen && (
              <>
                <Button asChild variant="outline">
                  <Link href={`/dms/job-cards/${j.id}/edit`}>
                    <Pencil className="size-4" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive"
                  onClick={() => setConfirm("delete")}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
                <Button
                  disabled={complete.isPending}
                  onClick={() => complete.mutate(j.id)}
                >
                  <CheckCircle2 className="size-4" />
                  {complete.isPending ? "Completing…" : "Complete"}
                </Button>
              </>
            )}
            {canWrite && isCompleted && (
              <Button variant="destructive" onClick={() => setConfirm("cancel")}>
                Cancel Job
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <Meta label="Parts Warehouse" value={j.warehouse ?? dash} />
          <Meta label="Technician" value={j.technician ?? dash} />
          <Meta label="Odometer" value={j.odometer != null ? `${j.odometer} km` : dash} />
          <Meta label="Service Date" value={fmtDateTime(j.serviceDate)} />
          {j.complaint && (
            <div className="sm:col-span-2 lg:col-span-3">
              <Meta label="Complaint" value={j.complaint} />
            </div>
          )}
        </CardContent>
      </Card>

      {j.parts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Parts</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
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
                      <span className="ml-2 text-muted-foreground">{p.itemName}</span>
                    </td>
                    <td className="p-3 text-right tabular-nums">{fmtQty(p.qty)}</td>
                    <td className="p-3 text-right tabular-nums">{fmtRate(p.rate)}</td>
                    <td className="p-3 text-right tabular-nums">{fmtMoney(p.amount)}</td>
                  </tr>
                ))}
                <tr className="border-t">
                  <td className="p-3 text-right text-xs font-semibold uppercase text-muted-foreground" colSpan={3}>
                    Parts total
                  </td>
                  <td className="p-3 text-right font-semibold tabular-nums">
                    {fmtMoney(j.partsTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {j.labor.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Labour</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
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
                  <td className="p-3 text-right text-xs font-semibold uppercase text-muted-foreground" colSpan={3}>
                    Labour total
                  </td>
                  <td className="p-3 text-right font-semibold tabular-nums">
                    {fmtMoney(j.laborTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {j.photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Photos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
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
                  alt={`Photo ${i + 1}`}
                  fill
                  sizes="112px"
                  className="object-cover"
                  unoptimized
                />
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <div className="flex w-64 justify-between border-t pt-3 text-base font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{fmtMoney(j.total)}</span>
        </div>
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
                ? "This permanently deletes the open job card."
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
    </div>
  );
}
