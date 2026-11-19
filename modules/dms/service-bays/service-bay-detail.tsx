"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGrid, Pencil, Trash2, Wrench, Zap } from "lucide-react";
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
import { useCanWrite } from "@/components/session-context";
import { useServiceBay, useDeleteServiceBay } from "./queries";

export function ServiceBayDetail({ bayId }: { bayId: string }) {
  const router = useRouter();
  const canWrite = useCanWrite("dms");
  const { data: b, isLoading } = useServiceBay(bayId);
  const del = useDeleteServiceBay();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading || !b) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DetailHeader
        icon={LayoutGrid}
        title={b.name}
        subtitle="Service bay"
        badge={
          <div className="flex items-center gap-2">
            {b.isHV && (
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400">
                HV bay
              </Badge>
            )}
            {b.active ? (
              <Badge>Active</Badge>
            ) : (
              <Badge variant="secondary">Inactive</Badge>
            )}
          </div>
        }
        stats={[{ label: "Job cards", value: b.jobCount }]}
        actions={
          canWrite && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href={`/dms/service-bays/${b.id}/edit`}>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="size-4 text-muted-foreground" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field icon={Zap} label="Type" value={b.isHV ? "HV bay" : "Standard"} />
          <Field
            icon={LayoutGrid}
            label="Status"
            value={b.active ? "Active" : "Inactive"}
          />
          <Field icon={Wrench} label="Job cards" value={b.jobCount} />
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {b.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Bays referenced by job cards or appointments can&apos;t be deleted
              — mark them inactive instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending}
              onClick={(e) => {
                e.preventDefault();
                del.mutate(b.id, {
                  onSuccess: () => {
                    setConfirmOpen(false);
                    router.push("/dms/service-bays");
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
