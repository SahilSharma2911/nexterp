"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, ClipboardCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCanWrite } from "@/components/session-context";
import { cn } from "@/lib/utils";
import { fmtDateTime } from "@/lib/format";
import { useDealerOptions } from "@/modules/dms/dealers/queries";
import { useCustomerOptions } from "@/features/customers/queries";
import { VEHICLE_STATUS_LABELS } from "./schema";
import { LIFECYCLE_ORDER, PDI_CHECKLIST } from "./lifecycle-schema";
import { StatusBadge } from "./columns";
import {
  useAllocateVehicle,
  useDeliverVehicle,
  useDispatchVehicle,
  useReceiveVehicle,
  useRunPdi,
  useVehicleLifecycle,
} from "./lifecycle-queries";

type DialogKind = null | "allocate" | "dispatch" | "receive" | "pdi" | "deliver";

export function VehicleLifecyclePanel({ vehicleId }: { vehicleId: string }) {
  const canWrite = useCanWrite("dms");
  const { data } = useVehicleLifecycle(vehicleId);
  const { data: dealerOptions = [] } = useDealerOptions();
  const { data: customerOptions = [] } = useCustomerOptions();

  const allocate = useAllocateVehicle(vehicleId);
  const dispatch = useDispatchVehicle(vehicleId);
  const receive = useReceiveVehicle(vehicleId);
  const pdi = useRunPdi(vehicleId);
  const deliver = useDeliverVehicle(vehicleId);

  const [open, setOpen] = useState<DialogKind>(null);
  const [dealerId, setDealerId] = useState("");
  const [note, setNote] = useState("");
  const [inspector, setInspector] = useState("");
  const [items, setItems] = useState(
    PDI_CHECKLIST.map((label) => ({ label, ok: true, note: "" })),
  );
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");

  if (!data) return null;
  const stage = data.stage;
  const curIdx = LIFECYCLE_ORDER.indexOf(stage);
  const close = () => setOpen(null);

  const openDialog = (k: DialogKind) => {
    setDealerId("");
    setNote("");
    setInspector("");
    setItems(PDI_CHECKLIST.map((label) => ({ label, ok: true, note: "" })));
    setCustomerId("");
    setCustomerName("");
    setOpen(k);
  };

  const busy =
    allocate.isPending ||
    dispatch.isPending ||
    receive.isPending ||
    pdi.isPending ||
    deliver.isPending;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Lifecycle</CardTitle>
        {canWrite && (
          <>
            {stage === "IN_STOCK" && (
              <Button size="sm" onClick={() => openDialog("allocate")}>
                Allocate to dealer
              </Button>
            )}
            {stage === "ALLOCATED" && (
              <Button size="sm" onClick={() => openDialog("dispatch")}>
                Dispatch
              </Button>
            )}
            {stage === "IN_TRANSIT" && (
              <Button size="sm" onClick={() => openDialog("receive")}>
                Receive at dealer
              </Button>
            )}
            {stage === "AT_DEALER" && (
              <Button size="sm" onClick={() => openDialog("pdi")}>
                <ClipboardCheck className="size-4" />
                Run PDI
              </Button>
            )}
            {stage === "PDI_DONE" && (
              <Button size="sm" onClick={() => openDialog("deliver")}>
                <CheckCircle2 className="size-4" />
                Deliver
              </Button>
            )}
          </>
        )}
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Stepper */}
        <ol className="flex flex-wrap items-center gap-1 text-xs">
          {LIFECYCLE_ORDER.map((s, i) => {
            const done = curIdx >= 0 && i < curIdx;
            const current = s === stage;
            return (
              <li key={s} className="flex items-center gap-1">
                <span
                  className={cn(
                    "rounded px-2 py-1 font-medium",
                    current
                      ? "bg-primary text-primary-foreground"
                      : done
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {VEHICLE_STATUS_LABELS[s]}
                </span>
                {i < LIFECYCLE_ORDER.length - 1 && (
                  <ArrowRight className="size-3 text-muted-foreground" />
                )}
              </li>
            );
          })}
          {stage === "IN_SERVICE" && (
            <li className="ml-2">
              <StatusBadge status="IN_SERVICE" />
            </li>
          )}
        </ol>

        {/* Timeline */}
        {data.timeline.length > 0 ? (
          <ol className="space-y-3 border-l pl-4">
            {data.timeline.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute top-1.5 -left-[22px] size-2.5 rounded-full border-2 border-background bg-primary" />
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <StatusBadge status={e.stage} />
                  <span className="text-muted-foreground">
                    {fmtDateTime(e.at)}
                  </span>
                  {e.dealer && (
                    <span className="text-muted-foreground">· {e.dealer}</span>
                  )}
                  {e.byUser && (
                    <span className="text-muted-foreground">· {e.byUser}</span>
                  )}
                </div>
                {e.note && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{e.note}</p>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">
            No movements yet — allocate this vehicle to start its journey.
          </p>
        )}
      </CardContent>

      {/* ---- Allocate ---- */}
      <Dialog open={open === "allocate"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate to dealer</DialogTitle>
            <DialogDescription>
              Pick a dealer (tip: allocate oldest-received units first — FIFO).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Dealer</Label>
              <Select value={dealerId || undefined} onValueChange={setDealerId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select dealer…" />
                </SelectTrigger>
                <SelectContent>
                  {dealerOptions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <NoteField value={note} onChange={setNote} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button
              disabled={busy || !dealerId}
              onClick={() =>
                allocate.mutate(
                  { dealerId, note: note || undefined },
                  { onSuccess: close },
                )
              }
            >
              Allocate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Dispatch / Receive (note only) ---- */}
      <SimpleNoteDialog
        open={open === "dispatch"}
        onClose={close}
        title="Dispatch to dealer"
        action="Dispatch"
        note={note}
        setNote={setNote}
        busy={busy}
        onConfirm={() => dispatch.mutate(note || undefined, { onSuccess: close })}
      />
      <SimpleNoteDialog
        open={open === "receive"}
        onClose={close}
        title="Receive at dealer"
        action="Mark received"
        note={note}
        setNote={setNote}
        busy={busy}
        onConfirm={() => receive.mutate(note || undefined, { onSuccess: close })}
      />

      {/* ---- PDI ---- */}
      <Dialog open={open === "pdi"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pre-Delivery Inspection</DialogTitle>
            <DialogDescription>
              All items must pass to advance the vehicle to “PDI Passed”.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Inspector</Label>
              <Input
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
                placeholder="Name"
              />
            </div>
            <ul className="divide-y rounded-lg border">
              {items.map((it, i) => (
                <li key={it.label} className="flex items-center gap-3 p-3">
                  <Checkbox
                    checked={it.ok}
                    onCheckedChange={(v) =>
                      setItems((arr) =>
                        arr.map((x, j) => (j === i ? { ...x, ok: !!v } : x)),
                      )
                    }
                  />
                  <span className="flex-1 text-sm">{it.label}</span>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      it.ok
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400",
                    )}
                  >
                    {it.ok ? "Pass" : "Fail"}
                  </span>
                </li>
              ))}
            </ul>
            <NoteField value={note} onChange={setNote} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button
              disabled={busy}
              onClick={() =>
                pdi.mutate(
                  { inspector: inspector || undefined, note: note || undefined, items },
                  { onSuccess: (r) => r.result === "PASS" && close() },
                )
              }
            >
              Submit PDI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Deliver ---- */}
      <Dialog open={open === "deliver"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deliver to customer</DialogTitle>
            <DialogDescription>Record the buyer and hand over.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Customer (existing)</Label>
              <Select
                value={customerId || undefined}
                onValueChange={(v) => {
                  setCustomerId(v);
                  const c = customerOptions.find((o) => o.id === v);
                  if (c) setCustomerName(c.customerName);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Optional — link a customer record" />
                </SelectTrigger>
                <SelectContent>
                  {customerOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.customerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Customer name</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Buyer name"
              />
            </div>
            <NoteField value={note} onChange={setNote} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button
              disabled={busy || !customerName.trim()}
              onClick={() =>
                deliver.mutate(
                  {
                    customerId: customerId || null,
                    customerName,
                    note: note || undefined,
                  },
                  { onSuccess: close },
                )
              }
            >
              Deliver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function NoteField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>Note (optional)</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder="Optional note for the timeline…"
      />
    </div>
  );
}

function SimpleNoteDialog({
  open,
  onClose,
  title,
  action,
  note,
  setNote,
  busy,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  action: string;
  note: string;
  setNote: (v: string) => void;
  busy: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <NoteField value={note} onChange={setNote} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={busy} onClick={onConfirm}>
            {action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
