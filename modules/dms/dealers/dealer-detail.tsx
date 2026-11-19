"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Car,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Receipt,
  Trash2,
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
import { useCanWrite } from "@/components/session-context";
import { useDealer, useDeleteDealer } from "./queries";

export function DealerDetail({ dealerId }: { dealerId: string }) {
  const router = useRouter();
  const canWrite = useCanWrite("dms");
  const { data: d, isLoading } = useDealer(dealerId);
  const del = useDeleteDealer();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading || !d) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
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
                {d.vehicleCount}
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field icon={User} label="Contact person" value={d.contactPerson ?? dash} />
            <Field icon={Phone} label="Phone" value={d.phone ?? dash} />
            <Field icon={Mail} label="Email" value={d.email ?? dash} />
            <Field icon={FileText} label="Legal name" value={d.legalName ?? dash} />
            <Field icon={Receipt} label="GSTIN / Tax ID" value={d.gstin ?? dash} />
            <Field
              icon={Car}
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
