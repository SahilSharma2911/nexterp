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
import { fmtDateTime, fmtMoney } from "@/lib/format";
import { useDeleteScheme, useScheme } from "./queries";

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

export function SchemeDetail({ schemeId }: { schemeId: string }) {
  const router = useRouter();
  const canWrite = useCanWrite("dms");
  const { data: s, isLoading } = useScheme(schemeId);
  const del = useDeleteScheme();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading || !s) {
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
        title={s.name}
        subtitle={s.code}
        actions={
          <div className="flex items-center gap-2">
            {s.status === "ACTIVE" ? (
              <Badge>Active</Badge>
            ) : (
              <Badge variant="secondary">Closed</Badge>
            )}
            {canWrite && (
              <>
                <Button asChild variant="outline">
                  <Link href={`/dms/subsidy-schemes/${s.id}/edit`}>
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
          <Meta label="Authority" value={s.authority ?? dash} />
          <Meta label="Subsidy amount" value={fmtMoney(s.amount)} />
          <Meta label="Valid from" value={fmtDateTime(s.validFrom)} />
          <Meta label="Valid to" value={fmtDateTime(s.validTo)} />
          <Meta label="Claims" value={s.claimCount} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {s.notes ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {s.notes}
            </p>
          ) : (
            dash
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {s.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the scheme. Schemes with claims can&apos;t
              be deleted — close them instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={del.isPending}
              onClick={(e) => {
                e.preventDefault();
                del.mutate(s.id, {
                  onSuccess: () => {
                    setConfirmOpen(false);
                    router.push("/dms/subsidy-schemes");
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
