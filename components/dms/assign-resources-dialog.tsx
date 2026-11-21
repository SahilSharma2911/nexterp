"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useServiceBayOptions } from "@/modules/dms/service-bays/queries";
import { useTechnicianOptions } from "@/modules/dms/technicians/queries";

const UNASSIGNED = "__none__";

// Shared quick-assign for the two workshop resources (technician + service bay).
// Reused by the appointment and job-card detail pages so the "assign without
// opening the full edit form" UX is identical everywhere. Mount it only while
// open (conditional render) so the selects initialise from the current values.
export function AssignResourcesDialog({
  isHV,
  bayId: initialBay,
  technicianId: initialTech,
  saving,
  onOpenChange,
  onSave,
}: {
  isHV: boolean;
  bayId: string | null;
  technicianId: string | null;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (vals: { bayId: string | null; technicianId: string | null }) => void;
}) {
  const { data: bayOptions = [] } = useServiceBayOptions();
  const { data: techOptions = [] } = useTechnicianOptions();
  const [bayId, setBayId] = useState(initialBay ?? "");
  const [technicianId, setTechnicianId] = useState(initialTech ?? "");

  const bays = isHV ? bayOptions.filter((b) => b.isHV) : bayOptions;
  const techs = isHV
    ? techOptions.filter((t) => t.isHVCertified)
    : techOptions;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign bay &amp; technician</DialogTitle>
          <DialogDescription>
            {isHV
              ? "High-voltage work — only HV bays and HV-certified technicians are shown."
              : "Pick who will do the work and where."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Technician</Label>
            <Select
              value={technicianId || UNASSIGNED}
              onValueChange={(v) =>
                setTechnicianId(v === UNASSIGNED ? "" : v)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>— Unassigned —</SelectItem>
                {techs.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                    {t.isHVCertified ? " · HV" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Service bay</Label>
            <Select
              value={bayId || UNASSIGNED}
              onValueChange={(v) => setBayId(v === UNASSIGNED ? "" : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>— Unassigned —</SelectItem>
                {bays.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                    {b.isHV ? " · HV" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={saving}
            onClick={() =>
              onSave({ bayId: bayId || null, technicianId: technicianId || null })
            }
          >
            {saving ? "Saving…" : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// A compact amber notice for a detail header when the resources are unassigned.
export function AssignNotice({
  label,
  onAssign,
  disabled,
}: {
  label: string;
  onAssign: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm">
      <span className="text-amber-700 dark:text-amber-400">{label}</span>
      {!disabled && (
        <Button
          size="sm"
          variant="outline"
          className="ml-auto border-amber-500/40"
          onClick={onAssign}
        >
          Assign now
        </Button>
      )}
    </div>
  );
}
