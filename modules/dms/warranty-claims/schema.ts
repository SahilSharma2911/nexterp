import { z } from "zod";

export const CLAIM_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "SETTLED",
  "CANCELLED",
] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SETTLED: "Settled",
  CANCELLED: "Cancelled",
};

export const claimFormSchema = z.object({
  warrantyId: z.string().min(1, "Select a warranty"),
  jobCardId: z.string().optional().nullable(),
  claimDate: z.string().optional().nullable(),
  description: z.string().trim().optional(),
  claimAmount: z.number().min(0, "Must be ≥ 0"),
  remarks: z.string().trim().optional(),
});

export type ClaimFormValues = z.infer<typeof claimFormSchema>;

export const emptyClaim: ClaimFormValues = {
  warrantyId: "",
  jobCardId: "",
  claimDate: "",
  description: "",
  claimAmount: 0,
  remarks: "",
};

export type ClaimListItem = {
  id: string;
  name: string;
  vehicle: string;
  component: string;
  status: ClaimStatus;
  claimDate: string;
  claimAmount: number;
  eligible: boolean | null;
};

export type ClaimDetail = {
  id: string;
  name: string;
  warrantyId: string;
  warrantyLabel: string;
  component: string;
  vehicleId: string;
  vehicle: string;
  jobCardId: string | null;
  jobCard: string | null;
  claimDate: string;
  description: string | null;
  status: ClaimStatus;
  claimAmount: number;
  approvedAmount: number;
  oemRef: string | null;
  eligible: boolean | null;
  eligibilityNote: string | null;
  remarks: string | null;
};

export type ClaimsTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};
