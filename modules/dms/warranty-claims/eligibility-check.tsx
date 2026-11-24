"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { useWarrantyOptions } from "@/modules/dms/warranties/queries";
import { usePreviewEligibility } from "./queries";
import { EligibilityResult } from "./eligibility-panel";

export function EligibilityCheck() {
  const { data: warrantyOptions = [], isLoading: loadingW } = useWarrantyOptions();
  const preview = usePreviewEligibility();

  const [warrantyId, setWarrantyId] = useState("");
  const [faultCode, setFaultCode] = useState("");
  const [odometer, setOdometer] = useState("");

  function run() {
    if (!warrantyId) return;
    preview.mutate({
      warrantyId,
      faultCode: faultCode.trim() || undefined,
      odometerKm: odometer === "" ? null : Number(odometer),
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShieldCheck className="size-4 text-muted-foreground" />
            Check coverage before raising a claim
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Label className="mb-1.5 block text-xs">Warranty</Label>
            <Combobox
              options={warrantyOptions.map((w) => ({ value: w.id, label: w.label }))}
              value={warrantyId}
              onChange={setWarrantyId}
              placeholder={loadingW ? "Loading…" : "Select an active warranty…"}
              searchPlaceholder="Search warranties…"
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Fault code</Label>
            <Input
              placeholder="e.g. P0A80"
              value={faultCode}
              onChange={(e) => setFaultCode(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Odometer (km, optional)</Label>
            <Input
              type="number"
              min="0"
              placeholder="auto from history"
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button disabled={!warrantyId || preview.isPending} onClick={run}>
              {preview.isPending ? "Checking…" : "Run eligibility check"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {preview.isPending && <Skeleton className="h-64 w-full rounded-xl" />}
      {preview.data && !preview.isPending && (
        <EligibilityResult data={preview.data} />
      )}
    </div>
  );
}
