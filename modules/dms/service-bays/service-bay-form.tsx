"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  serviceBayFormSchema,
  emptyServiceBay,
  type ServiceBayFormValues,
} from "./schema";
import {
  useCreateServiceBay,
  useServiceBay,
  useUpdateServiceBay,
} from "./queries";

export function ServiceBayForm({ bayId }: { bayId?: string }) {
  const router = useRouter();
  const isEdit = !!bayId;
  const { data: existing, isLoading } = useServiceBay(bayId);
  const create = useCreateServiceBay();
  const update = useUpdateServiceBay();

  const form = useForm<ServiceBayFormValues>({
    resolver: zodResolver(serviceBayFormSchema),
    defaultValues: emptyServiceBay,
  });

  useEffect(() => {
    if (isEdit && existing) {
      form.reset({
        name: existing.name,
        isHV: existing.isHV,
        active: existing.active,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existing]);

  const pending = create.isPending || update.isPending;

  function onSubmit(values: ServiceBayFormValues) {
    const done = () => router.push("/dms/service-bays");
    if (isEdit && bayId) {
      update.mutate({ id: bayId, values }, { onSuccess: done });
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
            <CardTitle className="text-sm">Service bay</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Bay 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isHV"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-2 space-y-0 rounded-lg border bg-muted/30 p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-0.5">
                    <FormLabel className="font-normal">HV bay</FormLabel>
                    <FormDescription>
                      Equipped for high-voltage (battery / motor) work.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0 self-start rounded-lg border bg-muted/30 p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Active</FormLabel>
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
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create bay"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
