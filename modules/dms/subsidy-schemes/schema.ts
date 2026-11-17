import { z } from "zod";

export const SUBSIDY_STATUSES = ["ACTIVE", "CLOSED"] as const;
export type SubsidyStatus = (typeof SUBSIDY_STATUSES)[number];

export const SUBSIDY_STATUS_LABELS: Record<SubsidyStatus, string> = {
  ACTIVE: "Active",
  CLOSED: "Closed",
};

export const schemeFormSchema = z.object({
  code: z.string().trim().min(1, "Scheme code is required"),
  name: z.string().trim().min(1, "Name is required"),
  authority: z.string().trim().optional(),
  amount: z.number().min(0, "Must be ≥ 0"),
  validFrom: z.string().optional().nullable(),
  validTo: z.string().optional().nullable(),
  status: z.enum(SUBSIDY_STATUSES),
  notes: z.string().trim().optional(),
});

export type SchemeFormValues = z.infer<typeof schemeFormSchema>;

export const emptyScheme: SchemeFormValues = {
  code: "",
  name: "",
  authority: "",
  amount: 0,
  validFrom: "",
  validTo: "",
  status: "ACTIVE",
  notes: "",
};

export type SubsidyScheme = {
  id: string;
  code: string;
  name: string;
  authority: string | null;
  amount: number;
  validFrom: string | null;
  validTo: string | null;
  status: SubsidyStatus;
  notes: string | null;
  claimCount: number;
};

export type SchemeOption = {
  id: string;
  code: string;
  name: string;
  amount: number;
};

export type SchemesTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};
