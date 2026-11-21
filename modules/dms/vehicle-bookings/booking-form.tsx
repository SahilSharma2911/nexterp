"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDealerOptions } from "@/modules/dms/dealers/queries";
import {
  PRIORITY_LABELS,
  bookingFormSchema,
  emptyBooking,
  type BookingFormValues,
} from "./schema";
import { useBooking, useCreateBooking, useUpdateBooking } from "./queries";

const UNASSIGNED = "__none__";

export function BookingForm({ bookingId }: { bookingId?: string }) {
  const router = useRouter();
  const isEdit = !!bookingId;
  const { data: existing, isLoading } = useBooking(bookingId);
  const { data: dealerOptions = [] } = useDealerOptions();
  const create = useCreateBooking();
  const update = useUpdateBooking();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: emptyBooking,
  });

  useEffect(() => {
    if (isEdit && existing) {
      form.reset({
        customerName: existing.customerName,
        phone: existing.phone ?? "",
        model: existing.model,
        variant: existing.variant ?? "",
        color: existing.color ?? "",
        dealerId: existing.dealerId ?? "",
        priority: existing.priority,
        advance: existing.advance,
        note: existing.note ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existing]);

  const pending = create.isPending || update.isPending;

  function onSubmit(values: BookingFormValues) {
    const done = (r: { id: string }) =>
      router.push(`/dms/vehicle-bookings/${r.id}`);
    if (isEdit && bookingId) {
      update.mutate({ id: bookingId, values }, { onSuccess: done });
    } else {
      create.mutate(values, { onSuccess: done });
    }
  }

  if (isEdit && isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Booking</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <FormControl>
                    <Input placeholder="Customer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dealerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dealer</FormLabel>
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
                      <SelectItem value={UNASSIGNED}>— None —</SelectItem>
                      {dealerOptions.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
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
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. City EV" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="variant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Colour</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3].map((p) => (
                        <SelectItem key={p} value={String(p)}>
                          {PRIORITY_LABELS[p]}
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
              name="advance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Advance / token (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? 0 : Number(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem className="lg:col-span-3">
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Anything to remember…"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create booking"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
