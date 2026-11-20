"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MultiImageUpload } from "@/components/multi-image-upload";
import { BarcodeScan } from "@/components/barcode-scan";
import { fmtMoney } from "@/lib/format";
import { useItemOptions } from "@/features/items/queries";
import { useWarehouseOptions } from "@/features/warehouses/queries";
import { useVehicleOptions } from "@/modules/dms/vehicles/queries";
import { useTechnicianOptions } from "@/modules/dms/technicians/queries";
import { useServiceBayOptions } from "@/modules/dms/service-bays/queries";
import {
  emptyJobCard,
  emptyJobCardLabor,
  emptyJobCardPart,
  jobCardFormSchema,
  type JobCardFormValues,
} from "./schema";
import { useCreateJobCard, useJobCard, useUpdateJobCard } from "./queries";

const UNASSIGNED = "__none__";
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function numChange(onChange: (v: number | null) => void, allowNull = false) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === "") onChange(allowNull ? null : 0);
    else onChange(Number(e.target.value));
  };
}

export function JobCardForm({
  jobId,
  prefillVehicleId,
}: {
  jobId?: string;
  prefillVehicleId?: string;
}) {
  const router = useRouter();
  const isEdit = !!jobId;
  const { data: existing } = useJobCard(jobId);
  const { data: vehicleOptions = [] } = useVehicleOptions();
  const { data: warehouseOptions = [] } = useWarehouseOptions();
  const { data: itemOptions = [] } = useItemOptions();
  const { data: technicianOptions = [] } = useTechnicianOptions();
  const { data: bayOptions = [] } = useServiceBayOptions();
  const create = useCreateJobCard();
  const update = useUpdateJobCard();

  const form = useForm<JobCardFormValues>({
    resolver: zodResolver(jobCardFormSchema),
    defaultValues: prefillVehicleId
      ? { ...emptyJobCard, vehicleId: prefillVehicleId }
      : emptyJobCard,
  });
  const parts = useFieldArray({ control: form.control, name: "parts" });
  const labor = useFieldArray({ control: form.control, name: "labor" });

  useEffect(() => {
    if (isEdit && existing) {
      form.reset({
        vehicleId: existing.vehicleId,
        warehouseId: existing.warehouseId ?? "",
        complaint: existing.complaint ?? "",
        technician: existing.technician ?? "",
        technicianId: existing.technicianId ?? "",
        bayId: existing.bayId ?? "",
        isHV: existing.isHV,
        odometer: existing.odometer,
        serviceDate: existing.serviceDate ? existing.serviceDate.slice(0, 10) : "",
        parts: existing.parts.map((p) => ({
          itemId: p.itemId,
          qty: p.qty,
          rate: p.rate,
        })),
        labor: existing.labor.map((l) => ({
          description: l.description,
          hours: l.hours,
          rate: l.rate,
        })),
        remarks: existing.remarks ?? "",
        photos: existing.photos ?? [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existing]);

  const watchedParts = useWatch({ control: form.control, name: "parts" });
  const watchedLabor = useWatch({ control: form.control, name: "labor" });
  const partsTotal = round2(
    (watchedParts ?? []).reduce(
      (s, p) => s + (Number(p?.qty) || 0) * (Number(p?.rate) || 0),
      0,
    ),
  );
  const laborTotal = round2(
    (watchedLabor ?? []).reduce(
      (s, l) => s + (Number(l?.hours) || 0) * (Number(l?.rate) || 0),
      0,
    ),
  );
  const grand = round2(partsTotal + laborTotal);
  const pending = create.isPending || update.isPending;

  function onSubmit(values: JobCardFormValues) {
    const done = (r: { id: string }) => router.push(`/dms/job-cards/${r.id}`);
    if (isEdit && jobId) {
      update.mutate({ id: jobId, values }, { onSuccess: done });
    } else {
      create.mutate(values, { onSuccess: done });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Job</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="vehicleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle</FormLabel>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select vehicle…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehicleOptions.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.vin} — {v.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="warehouseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parts Warehouse</FormLabel>
                  <Select
                    value={field.value || UNASSIGNED}
                    onValueChange={(v) => field.onChange(v === UNASSIGNED ? "" : v)}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>— None —</SelectItem>
                      {warehouseOptions.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.warehouseName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="technicianId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Technician</FormLabel>
                  <Select
                    value={field.value || UNASSIGNED}
                    onValueChange={(v) =>
                      field.onChange(v === UNASSIGNED ? "" : v)
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>— Unassigned —</SelectItem>
                      {technicianOptions.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                          {t.isHVCertified ? " · HV" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bayId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Bay</FormLabel>
                  <Select
                    value={field.value || UNASSIGNED}
                    onValueChange={(v) =>
                      field.onChange(v === UNASSIGNED ? "" : v)
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UNASSIGNED}>— Unassigned —</SelectItem>
                      {bayOptions.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                          {b.isHV ? " · HV" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isHV"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0 self-end rounded-lg border bg-muted/30 p-3">
                  <FormControl>
                    <Checkbox
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    High-voltage (battery / motor) work
                  </FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="odometer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Odometer (km)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      value={field.value ?? ""}
                      onChange={numChange(field.onChange, true)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="serviceDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="complaint"
              render={({ field }) => (
                <FormItem className="lg:col-span-3">
                  <FormLabel>Complaint / Notes</FormLabel>
                  <FormControl>
                    <Input placeholder="Customer complaint…" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Parts */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium">Parts</h2>
            <div className="flex items-center gap-2">
              <BarcodeScan
                className="w-60"
                placeholder="Scan part barcode…"
                onItem={(it) =>
                  parts.append({
                    itemId: it.id,
                    qty: 1,
                    rate: it.valuationRate,
                  })
                }
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => parts.append({ ...emptyJobCardPart })}
              >
                <Plus className="size-4" />
                Add part
              </Button>
            </div>
          </div>
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="p-3 font-medium">Part</th>
                    <th className="w-24 p-3 font-medium">Qty</th>
                    <th className="w-32 p-3 font-medium">Rate</th>
                    <th className="w-32 p-3 text-right font-medium">Amount</th>
                    <th className="w-10 p-3" />
                  </tr>
                </thead>
                <tbody>
                  {parts.fields.length === 0 && (
                    <tr>
                      <td className="p-3 text-muted-foreground" colSpan={5}>
                        No parts — add one, or leave empty for a labour-only job.
                      </td>
                    </tr>
                  )}
                  {parts.fields.map((row, i) => {
                    const qty = Number(watchedParts?.[i]?.qty) || 0;
                    const rate = Number(watchedParts?.[i]?.rate) || 0;
                    return (
                      <tr key={row.id} className="border-b last:border-0">
                        <td className="p-2 align-top">
                          <FormField
                            control={form.control}
                            name={`parts.${i}.itemId`}
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  value={field.value || undefined}
                                  onValueChange={(v) => {
                                    field.onChange(v);
                                    const opt = itemOptions.find((o) => o.id === v);
                                    const cur = form.getValues(`parts.${i}.rate`);
                                    if (opt && (!cur || cur === 0))
                                      form.setValue(`parts.${i}.rate`, opt.valuationRate);
                                  }}
                                >
                                  <FormControl>
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select part…" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {itemOptions.map((o) => (
                                      <SelectItem key={o.id} value={o.id}>
                                        {o.itemCode} — {o.itemName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="p-2 align-top">
                          <FormField
                            control={form.control}
                            name={`parts.${i}.qty`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    value={field.value}
                                    onChange={numChange(field.onChange)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="p-2 align-top">
                          <FormField
                            control={form.control}
                            name={`parts.${i}.rate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={field.value}
                                    onChange={numChange(field.onChange)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="p-3 text-right align-middle tabular-nums text-muted-foreground">
                          {fmtMoney(round2(qty * rate))}
                        </td>
                        <td className="p-2 text-right align-middle">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => parts.remove(i)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Labour */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Labour</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => labor.append({ ...emptyJobCardLabor })}
            >
              <Plus className="size-4" />
              Add labour
            </Button>
          </div>
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="p-3 font-medium">Work</th>
                    <th className="w-24 p-3 font-medium">Hours</th>
                    <th className="w-32 p-3 font-medium">Rate</th>
                    <th className="w-32 p-3 text-right font-medium">Amount</th>
                    <th className="w-10 p-3" />
                  </tr>
                </thead>
                <tbody>
                  {labor.fields.length === 0 && (
                    <tr>
                      <td className="p-3 text-muted-foreground" colSpan={5}>
                        No labour lines.
                      </td>
                    </tr>
                  )}
                  {labor.fields.map((row, i) => {
                    const hours = Number(watchedLabor?.[i]?.hours) || 0;
                    const rate = Number(watchedLabor?.[i]?.rate) || 0;
                    return (
                      <tr key={row.id} className="border-b last:border-0">
                        <td className="p-2 align-top">
                          <FormField
                            control={form.control}
                            name={`labor.${i}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="e.g. Brake pad replacement" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="p-2 align-top">
                          <FormField
                            control={form.control}
                            name={`labor.${i}.hours`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={field.value}
                                    onChange={numChange(field.onChange)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="p-2 align-top">
                          <FormField
                            control={form.control}
                            name={`labor.${i}.rate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={field.value}
                                    onChange={numChange(field.onChange)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="p-3 text-right align-middle tabular-nums text-muted-foreground">
                          {fmtMoney(round2(hours * rate))}
                        </td>
                        <td className="p-2 text-right align-middle">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => labor.remove(i)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-medium">Photos</h2>
          <Card>
            <CardContent>
              <FormField
                control={form.control}
                name="photos"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <MultiImageUpload
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col items-end gap-1 text-sm">
          <div className="flex w-56 justify-between text-muted-foreground">
            <span>Parts</span>
            <span className="tabular-nums">{fmtMoney(partsTotal)}</span>
          </div>
          <div className="flex w-56 justify-between text-muted-foreground">
            <span>Labour</span>
            <span className="tabular-nums">{fmtMoney(laborTotal)}</span>
          </div>
          <div className="flex w-56 justify-between font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{fmtMoney(grand)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create job card"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
