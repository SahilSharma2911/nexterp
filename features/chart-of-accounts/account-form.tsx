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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ACCOUNT_TYPES,
  accountFormSchema,
  emptyAccount,
  ROOT_TYPES,
  type AccountFormValues,
} from "./schema";
import { useAccount, useCreateAccount, useUpdateAccount } from "./queries";

const rootLabel = (r: string) => r.charAt(0) + r.slice(1).toLowerCase();

export function AccountForm({ accountId }: { accountId?: string }) {
  const router = useRouter();
  const isEdit = !!accountId;
  const { data: existing, isLoading } = useAccount(accountId);
  const create = useCreateAccount();
  const update = useUpdateAccount();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: emptyAccount,
  });

  useEffect(() => {
    if (isEdit && existing) {
      form.reset({
        accountName: existing.accountName,
        accountType: existing.accountType ?? "",
        rootType: existing.rootType as AccountFormValues["rootType"],
        disabled: existing.disabled,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existing]);

  const pending = create.isPending || update.isPending;

  function onSubmit(values: AccountFormValues) {
    const done = () => router.push("/accounts/chart");
    if (isEdit && accountId) {
      update.mutate({ id: accountId, values }, { onSuccess: done });
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
            <CardTitle className="text-sm">Account</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="accountName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Debtors" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rootType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Root Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a root type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROOT_TYPES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {rootLabel(r)}
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
              name="accountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Receivable"
                      list="account-types"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <datalist id="account-types">
                    {ACCOUNT_TYPES.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="disabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0 self-end rounded-lg border bg-muted/30 p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Disabled</FormLabel>
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
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create account"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
