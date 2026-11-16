import { z } from "zod";

export const PAYMENT_TYPES = ["RECEIVE", "PAY"] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  RECEIVE: "Receive",
  PAY: "Pay",
};

export const paymentEntryFormSchema = z
  .object({
    paymentType: z.enum(PAYMENT_TYPES),
    accountId: z.string().min(1, "Select the cash/bank account"),
    customerId: z.string().optional().nullable(),
    supplierId: z.string().optional().nullable(),
    salesInvoiceId: z.string().optional().nullable(),
    purchaseInvoiceId: z.string().optional().nullable(),
    amount: z.number().positive("Amount must be > 0"),
    remarks: z.string().trim().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.paymentType === "RECEIVE" && !v.customerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select the customer",
        path: ["customerId"],
      });
    }
    if (v.paymentType === "PAY" && !v.supplierId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select the supplier",
        path: ["supplierId"],
      });
    }
  });

export type PaymentEntryFormValues = z.infer<typeof paymentEntryFormSchema>;

export const emptyPaymentEntry: PaymentEntryFormValues = {
  paymentType: "RECEIVE",
  accountId: "",
  customerId: "",
  supplierId: "",
  salesInvoiceId: "",
  purchaseInvoiceId: "",
  amount: 0,
  remarks: "",
};

// ---- read models ----

export type PaymentEntryListItem = {
  id: string;
  name: string;
  paymentType: string;
  party: string;
  account: string;
  amount: number;
  status: string;
  postingAt: string;
};

export type PaymentEntryDetail = {
  id: string;
  name: string;
  paymentType: string;
  accountId: string;
  account: string;
  customerId: string | null;
  supplierId: string | null;
  salesInvoiceId: string | null;
  purchaseInvoiceId: string | null;
  party: string;
  invoice: string | null;
  amount: number;
  status: string;
  postingAt: string;
  remarks: string | null;
};

export type PaymentEntriesTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};

// Prefill payload passed to the form from ?si= / ?pi= links.
export type PaymentPrefill = {
  paymentType: PaymentType;
  customerId?: string;
  supplierId?: string;
  salesInvoiceId?: string;
  purchaseInvoiceId?: string;
  amount: number;
};
