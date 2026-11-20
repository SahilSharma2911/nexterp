"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Plus,
  Settings2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCanWrite } from "@/components/session-context";
import { cn } from "@/lib/utils";
import { fmtDateTime } from "@/lib/format";
import { useDealerOptions } from "@/modules/dms/dealers/queries";
import { FifoAgingCard } from "@/modules/dms/vehicles/fifo-aging-card";
import {
  ALLOCATION_STATUS_LABELS,
  PRIORITY_LABELS,
  type AllocationRule,
  type AllocationStatus,
} from "./schema";
import {
  useAllocationActivity,
  useAllocationPreview,
  useAllocationRequests,
  useAllocationRule,
  useCancelRequest,
  useCommitAllocation,
  useCreateRequest,
  useDeleteRequest,
  useUpdateRule,
} from "./queries";

const statusStyle: Record<AllocationStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  PARTIAL: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  FULFILLED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  CANCELLED: "bg-muted text-muted-foreground",
};

function RuleToggle({
  checked,
  disabled,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <label className="flex items-start gap-2.5">
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(v) => onChange(!!v)}
        className="mt-0.5"
      />
      <span>
        <span className="text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}

export function AllocationWorkspace() {
  const canWrite = useCanWrite("dms");
  const commit = useCommitAllocation();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {canWrite && (
          <>
            <Button variant="outline" size="sm" onClick={() => setNewOpen(true)}>
              <Plus className="size-4" />
              New request
            </Button>
            <Button size="sm" onClick={() => setPreviewOpen(true)}>
              <Sparkles className="size-4" />
              Auto-allocate
            </Button>
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <RequestsCard canWrite={canWrite} />
          <FifoAgingCard showAllocationLink={false} />
          <ActivityCard />
        </div>
        <RulesCard canWrite={canWrite} />
      </div>

      {canWrite && (
        <>
          <NewRequestDialog open={newOpen} onOpenChange={setNewOpen} />
          <PreviewDialog
            open={previewOpen}
            onOpenChange={setPreviewOpen}
            committing={commit.isPending}
            onConfirm={() =>
              commit.mutate(undefined, {
                onSuccess: () => setPreviewOpen(false),
              })
            }
          />
        </>
      )}
    </div>
  );
}

function RequestsCard({ canWrite }: { canWrite: boolean }) {
  const { data, isLoading } = useAllocationRequests();
  const cancel = useCancelRequest();
  const del = useDeleteRequest();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-4 text-muted-foreground" />
          Allocation requests (demand)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No requests yet. Add one, then run auto-allocate.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[11px] tracking-wider text-muted-foreground uppercase">
                  <th className="p-3 font-medium">Request</th>
                  <th className="p-3 font-medium">Dealer</th>
                  <th className="p-3 font-medium">Model</th>
                  <th className="p-3 text-right font-medium">Qty</th>
                  <th className="p-3 font-medium">Priority</th>
                  <th className="p-3 font-medium">Status</th>
                  {canWrite && <th className="w-10 p-3" />}
                </tr>
              </thead>
              <tbody>
                {data.map((r) => {
                  const open = r.status === "PENDING" || r.status === "PARTIAL";
                  return (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="p-3 font-mono text-xs">{r.name}</td>
                      <td className="p-3">
                        <Link
                          href={`/dms/dealers/${r.dealerId}`}
                          className="text-primary hover:underline"
                        >
                          {r.dealer}
                        </Link>
                      </td>
                      <td className="p-3">
                        {r.model}
                        {r.variant && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {r.variant}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        {r.qtyAllocated}/{r.qty}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {PRIORITY_LABELS[r.priority] ?? r.priority}
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "inline-flex rounded px-2 py-0.5 text-xs font-medium",
                            statusStyle[r.status],
                          )}
                        >
                          {ALLOCATION_STATUS_LABELS[r.status]}
                        </span>
                      </td>
                      {canWrite && (
                        <td className="p-2 text-right">
                          {open ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              title="Cancel request"
                              disabled={cancel.isPending}
                              onClick={() => cancel.mutate(r.id)}
                            >
                              <X className="size-3.5" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              title="Delete request"
                              disabled={del.isPending}
                              onClick={() => del.mutate(r.id)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RulesCard({ canWrite }: { canWrite: boolean }) {
  const { data, isLoading } = useAllocationRule();
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="size-4 text-muted-foreground" />
          FIFO rules
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading || !data ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))
        ) : (
          <RulesForm initial={data} canWrite={canWrite} />
        )}
      </CardContent>
    </Card>
  );
}

function RulesForm({
  initial,
  canWrite,
}: {
  initial: AllocationRule;
  canWrite: boolean;
}) {
  const update = useUpdateRule();
  const [form, setForm] = useState({
    oldestFirst: initial.oldestFirst,
    matchModel: initial.matchModel,
    matchVariant: initial.matchVariant,
    maxAgeDays: initial.maxAgeDays != null ? String(initial.maxAgeDays) : "",
  });

  return (
    <>
        <RuleToggle
          checked={form.oldestFirst}
          disabled={!canWrite}
          onChange={(v) => setForm((s) => ({ ...s, oldestFirst: v }))}
          label="Oldest stock first (FIFO)"
          hint="Allocate the longest-sitting vehicles before newer ones."
        />
        <RuleToggle
          checked={form.matchModel}
          disabled={!canWrite}
          onChange={(v) => setForm((s) => ({ ...s, matchModel: v }))}
          label="Match the model"
          hint="Only allocate a vehicle whose model matches the request."
        />
        <RuleToggle
          checked={form.matchVariant}
          disabled={!canWrite}
          onChange={(v) => setForm((s) => ({ ...s, matchVariant: v }))}
          label="Also match the variant"
          hint="Stricter — the variant must match too."
        />
        <div className="space-y-1.5">
          <Label htmlFor="maxAge" className="text-sm">
            Aging flag (days)
          </Label>
          <Input
            id="maxAge"
            type="number"
            min="0"
            placeholder="e.g. 60"
            value={form.maxAgeDays}
            disabled={!canWrite}
            onChange={(e) =>
              setForm((s) => ({ ...s, maxAgeDays: e.target.value }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Stock older than this is highlighted as aging.
          </p>
        </div>
        {canWrite && (
          <Button
            size="sm"
            className="w-full"
            disabled={update.isPending}
            onClick={() =>
              update.mutate({
                oldestFirst: form.oldestFirst,
                matchModel: form.matchModel,
                matchVariant: form.matchVariant,
                maxAgeDays: form.maxAgeDays ? Number(form.maxAgeDays) : null,
              })
            }
          >
            {update.isPending ? "Saving…" : "Save rules"}
          </Button>
        )}
    </>
  );
}

function ActivityCard() {
  const { data, isLoading } = useAllocationActivity();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-4 text-muted-foreground" />
          Allocation activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No allocations yet.
          </p>
        ) : (
          <ul className="divide-y text-sm">
            {data.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5"
              >
                <Link
                  href={`/dms/vehicles/${e.vehicleId}`}
                  className="font-mono text-xs text-primary hover:underline"
                >
                  {e.vin}
                </Link>
                <span className="text-muted-foreground">{e.model}</span>
                <span className="text-muted-foreground">→ {e.dealer ?? "—"}</span>
                <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                  {e.byUser && <span>{e.byUser}</span>}
                  <span>{fmtDateTime(e.at)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function NewRequestDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { data: dealers = [] } = useDealerOptions();
  const create = useCreateRequest();
  const [f, setF] = useState({
    dealerId: "",
    model: "",
    variant: "",
    qty: 1,
    priority: 2,
    note: "",
  });

  function reset() {
    setF({ dealerId: "", model: "", variant: "", qty: 1, priority: 2, note: "" });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New allocation request</DialogTitle>
          <DialogDescription>
            A dealer&apos;s demand — the engine will fulfil it from stock.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Dealer</Label>
            <Select
              value={f.dealerId || undefined}
              onValueChange={(v) => setF((s) => ({ ...s, dealerId: v }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select dealer…" />
              </SelectTrigger>
              <SelectContent>
                {dealers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Model</Label>
            <Input
              placeholder="Volt City"
              value={f.model}
              onChange={(e) => setF((s) => ({ ...s, model: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Variant (optional)</Label>
            <Input
              placeholder="Long Range"
              value={f.variant}
              onChange={(e) => setF((s) => ({ ...s, variant: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Quantity</Label>
            <Input
              type="number"
              min="1"
              value={f.qty}
              onChange={(e) =>
                setF((s) => ({ ...s, qty: Number(e.target.value) }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select
              value={String(f.priority)}
              onValueChange={(v) => setF((s) => ({ ...s, priority: Number(v) }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">High</SelectItem>
                <SelectItem value="2">Normal</SelectItem>
                <SelectItem value="3">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!f.dealerId || !f.model.trim() || f.qty < 1 || create.isPending}
            onClick={() =>
              create.mutate(f, {
                onSuccess: () => {
                  reset();
                  onOpenChange(false);
                },
              })
            }
          >
            {create.isPending ? "Adding…" : "Add request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewDialog({
  open,
  onOpenChange,
  onConfirm,
  committing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: () => void;
  committing: boolean;
}) {
  const { data, isLoading } = useAllocationPreview(open);
  const nothing = data && data.lines.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Auto-allocate preview
          </DialogTitle>
          <DialogDescription>
            FIFO rules applied — review the plan before committing. Nothing is
            allocated until you confirm.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2 py-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : nothing ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No matching in-stock vehicles for the open requests.
          </p>
        ) : (
          <div className="space-y-3 py-2">
            {data?.lines.map((line) => (
              <div
                key={line.requestId}
                className="rounded-lg border p-3 text-sm"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span>
                    <span className="font-mono text-xs">{line.requestName}</span>{" "}
                    → <span className="font-medium">{line.dealer}</span>
                  </span>
                  <Badge variant="secondary">
                    {line.vehicles.length} of {line.need}
                  </Badge>
                </div>
                <ul className="space-y-1">
                  {line.vehicles.map((v) => (
                    <li
                      key={v.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="font-mono">{v.vin}</span>
                      <span className="text-muted-foreground">
                        {[v.model, v.variant].filter(Boolean).join(" · ")} ·{" "}
                        {v.daysInStock}d in stock
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {data && data.unmatched.length > 0 && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                <span className="font-semibold">Short on stock:</span>{" "}
                {data.unmatched
                  .map(
                    (u) =>
                      `${u.requestName} (${u.short}× ${u.model}${u.variant ? " " + u.variant : ""})`,
                  )
                  .join(", ")}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={committing || isLoading || nothing}
            onClick={onConfirm}
          >
            {committing
              ? "Allocating…"
              : `Confirm & allocate ${data?.totalVehicles ?? ""}`.trim()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
