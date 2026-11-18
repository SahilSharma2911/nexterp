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
import { useTechnician, useDeleteTechnician } from "./queries";

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

export function TechnicianDetail({ technicianId }: { technicianId: string }) {
  const router = useRouter();
  const canWrite = useCanWrite("dms");
  const { data: t, isLoading } = useTechnician(technicianId);
  const del = useDeleteTechnician();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading || !t) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const dash = <span className="text-muted-foreground">—</span>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.name}
        subtitle="Technician"
        actions={
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
            {canWrite && (
              <>
                <Button asChild variant="outline">
                  <Link href={`/dms/technicians/${t.id}/edit`}>
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
          <Meta label="Phone" value={t.phone ?? dash} />
          <Meta label="Skills" value={t.skills ?? dash} />
          <Meta
            label="HV certified"
            value={t.isHVCertified ? "Yes" : "No"}
          />
          <Meta label="Job cards" value={t.jobCount} />
        </CardContent>
      </Card>

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
