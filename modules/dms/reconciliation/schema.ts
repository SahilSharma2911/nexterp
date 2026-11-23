import { z } from "zod";

export const CREDIT_NOTE_STATUSES = ["UNMATCHED", "MATCHED", "DISCREPANCY"] as const;
export type CreditNoteStatus = (typeof CREDIT_NOTE_STATUSES)[number];

export const CREDIT_NOTE_STATUS_LABELS: Record<CreditNoteStatus, string> = {
  UNMATCHED: "Unmatched",
  MATCHED: "Matched",
  DISCREPANCY: "Discrepancy",
};

export const creditNoteFormSchema = z.object({
  number: z.string().trim().min(1, "Credit note number is required"),
  oemRef: z.string().trim().optional(),
  amount: z.number().min(0, "Must be ≥ 0"),
  noteDate: z.string().optional().nullable(),
  claimId: z.string().optional().nullable(),
  notes: z.string().trim().optional(),
});

export type CreditNoteFormValues = z.infer<typeof creditNoteFormSchema>;

export const emptyCreditNote: CreditNoteFormValues = {
  number: "",
  oemRef: "",
  amount: 0,
  noteDate: "",
  claimId: "",
  notes: "",
};

export type CreditNoteRow = {
  id: string;
  number: string;
  oemRef: string | null;
  amount: number;
  noteDate: string;
  status: CreditNoteStatus;
  claimId: string | null;
  claimName: string | null;
  approvedAmount: number | null; // of the matched claim
};

// A claim option for matching a credit note, with its reconciliation figures.
export type ClaimReconOption = {
  id: string;
  name: string;
  vehicle: string;
  approvedAmount: number;
  reimbursedAmount: number;
  outstanding: number;
};

export type ReconciliationSummary = {
  totalApproved: number;
  totalReimbursed: number;
  totalOutstanding: number;
  discrepancies: number;
  unmatchedNotes: number;
  unmatchedValue: number;
  aging: { bucket: string; count: number; amount: number }[];
  topOutstanding: {
    id: string;
    name: string;
    vehicle: string;
    approvedAmount: number;
    reimbursedAmount: number;
    outstanding: number;
    daysOutstanding: number;
  }[];
  trend: { name: string; value: number }[]; // reimbursed per month (last 6)
  recentNotes: CreditNoteRow[];
};
