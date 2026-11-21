"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ScanLine, Car, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCanWrite } from "@/components/session-context";
import { fetchVehicleByVin } from "./lifecycle-api";
import * as lc from "./lifecycle-api";
import { StatusBadge } from "./columns";
import type { VehicleScanResult } from "./lifecycle-schema";
import type { VehicleStatus } from "./schema";

// Each stage's single next action. One-click stages need no extra data; the
// rest (allocate / PDI / deliver) carry a form, so we send the user to the
// vehicle's lifecycle panel instead.
const NEXT: Record<
  VehicleStatus,
  { label: string; mode: "dispatch" | "receive" | "detail" | "done" }
> = {
  IN_STOCK: { label: "Allocate to a dealer", mode: "detail" },
  ALLOCATED: { label: "Dispatch — mark in transit", mode: "dispatch" },
  IN_TRANSIT: { label: "Receive at dealer", mode: "receive" },
  AT_DEALER: { label: "Run PDI inspection", mode: "detail" },
  PDI_DONE: { label: "Deliver to customer", mode: "detail" },
  DELIVERED: { label: "Lifecycle complete", mode: "done" },
  IN_SERVICE: { label: "In service", mode: "done" },
};

const ADVANCED: Partial<Record<VehicleStatus, VehicleStatus>> = {
  ALLOCATED: "IN_TRANSIT",
  IN_TRANSIT: "AT_DEALER",
};

export function VehicleScanPanel() {
  const canWrite = useCanWrite("dms");
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [vehicle, setVehicle] = useState<VehicleScanResult | null>(null);

  const advance = useMutation({
    mutationFn: async ({
      id,
      mode,
    }: {
      id: string;
      mode: "dispatch" | "receive";
    }) => {
      if (mode === "dispatch") await lc.dispatch(id);
      else await lc.receiveAtDealer(id);
    },
    onSuccess: (_d, { mode }) => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      setVehicle((v) =>
        v ? { ...v, status: ADVANCED[v.status] ?? v.status } : v,
      );
      toast.success(
        mode === "dispatch" ? "Dispatched — in transit" : "Received at dealer",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function lookup() {
    const c = code.trim();
    if (!c || busy) return;
    setBusy(true);
    try {
      const v = await fetchVehicleByVin(c);
      if (v) {
        setVehicle(v);
        setCode("");
      } else {
        toast.error(`No vehicle found for VIN "${c}"`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scan lookup failed");
    } finally {
      setBusy(false);
    }
  }

  const next = vehicle ? NEXT[vehicle.status] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <ScanLine className="size-4 text-muted-foreground" />
          Scan a vehicle
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                lookup();
              }
            }}
            placeholder="Scan or type a VIN…"
            className="max-w-sm font-mono"
          />
          <Button variant="outline" onClick={lookup} disabled={busy}>
            {busy ? "Looking up…" : "Find"}
          </Button>
        </div>

        {vehicle && next && (
          <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/30 p-3">
            <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
              {vehicle.imageUrl ? (
                <Image
                  src={vehicle.imageUrl}
                  alt={vehicle.model}
                  fill
                  sizes="48px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <Car className="size-5 text-muted-foreground" />
              )}
            </span>
            <div className="min-w-0">
              <Link
                href={`/dms/vehicles/${vehicle.id}`}
                className="font-mono text-sm font-medium text-primary hover:underline"
              >
                {vehicle.vin}
              </Link>
              <p className="text-xs text-muted-foreground">
                {[vehicle.model, vehicle.variant].filter(Boolean).join(" ")}
                {vehicle.dealerName ? ` · ${vehicle.dealerName}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Now</span>
              <StatusBadge status={vehicle.status} />
            </div>

            <div className="ml-auto flex items-center gap-2">
              {next.mode === "done" ? (
                <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-4" />
                  {next.label}
                </span>
              ) : next.mode === "detail" ? (
                <Button asChild size="sm">
                  <Link href={`/dms/vehicles/${vehicle.id}`}>
                    {next.label}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                canWrite && (
                  <Button
                    size="sm"
                    disabled={advance.isPending}
                    onClick={() =>
                      advance.mutate({
                        id: vehicle.id,
                        mode: next.mode as "dispatch" | "receive",
                      })
                    }
                  >
                    {advance.isPending ? "Advancing…" : next.label}
                    <ArrowRight className="size-4" />
                  </Button>
                )
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
