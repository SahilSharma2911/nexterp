"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
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
import { PageHeader } from "@/components/page-header";
import { useCanWrite } from "@/components/session-context";
import { useDealer, useDeleteDealer } from "./queries";

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

export function DealerDetail({ dealerId }: { dealerId: string }) {
  const router = useRouter();
  const canWrite = useCanWrite("dms");
  const { data: d, isLoading } = useDealer(dealerId);
  const del = useDeleteDealer();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading || !d) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const dash = <span className="text-muted-foreground">—</span>;
  const address = [
    d.addressLine1,
    d.addressLine2,
    [d.city, d.state].filter(Boolean).join(", "),
    [d.postalCode, d.country].filter(Boolean).join(" "),
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader
        title={d.name}
        subtitle={d.code}
        actions={
          <div className="flex items-center gap-2">
            {d.disabled ? (
              <Badge variant="secondary">Disabled</Badge>
            ) : (
              <Badge>Active</Badge>
            )}
            {canWrite && (
              <>
                <Button asChild variant="outline">
                  <Link href={`/dms/dealers/${d.id}/edit`}>
                    <Pencil className="size-4" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive"
                  onClick={() => setConfirmOpen(true)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </>
            )}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Meta label="Legal Name" value={d.legalName ?? dash} />
          <Meta label="GSTIN / Tax ID" value={d.gstin ?? dash} />
          <Meta
            label="Vehicles assigned"
            value={
              <Link
                href={`/dms/vehicles?dealer=${d.id}`}
                className="text-primary hover:underline"
              >
                {d.vehicleCount}
              </Link>
            }
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Contact</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Meta label="Contact Person" value={d.contactPerson ?? dash} />
            <Meta label="Phone" value={d.phone ?? dash} />
            <Meta label="Email" value={d.email ?? dash} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Address</CardTitle>
          </CardHeader>
          <CardContent>
            {address.length ? (
              <address className="text-sm not-italic leading-relaxed">
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
