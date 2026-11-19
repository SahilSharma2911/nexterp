import { z } from "zod";

export const SUBSIDY_CLAIM_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "DISBURSED",
  "REJECTED",
  "CANCELLED",
] as const;
export type SubsidyClaimStatus = (typeof SUBSIDY_CLAIM_STATUSES)[number];

export const SUBSIDY_CLAIM_STATUS_LABELS: Record<SubsidyClaimStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  DISBURSED: "Disbursed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export const KYC_DOC_TYPES = [
  "Aadhaar",
  "PAN",
  "Passport",
  "Driving License",
  "Voter ID",
];

export const subsidyClaimFormSchema = z.object({
  schemeId: z.string().min(1, "Select a scheme"),
  vehicleId: z.string().min(1, "Select a vehicle"),
  customerName: z.string().trim().min(1, "Customer name is required"),
  kycDocType: z.string().trim().optional(),
  kycRef: z.string().trim().optional(),
  kycDocUrl: z.string().optional().nullable(),
  kycVerified: z.boolean(),
  claimAmount: z.number().min(0, "Must be ≥ 0"),
  remarks: z.string().trim().optional(),
});

export type SubsidyClaimFormValues = z.infer<typeof subsidyClaimFormSchema>;

export const emptySubsidyClaim: SubsidyClaimFormValues = {
  schemeId: "",
  vehicleId: "",
  customerName: "",
  kycDocType: "",
  kycRef: "",
  kycDocUrl: null,
  kycVerified: false,
  claimAmount: 0,
  remarks: "",
};

export type SubsidyClaimListItem = {
  id: string;
  name: string;
  scheme: string;
  vehicle: string;
  customerName: string;
  claimAmount: number;
  kycVerified: boolean;
  status: SubsidyClaimStatus;
};

export type SubsidyClaimDetail = {
  id: string;
  name: string;
  schemeId: string;
  scheme: string;
  vehicleId: string;
  vehicle: string;
  customerName: string;
  kycDocType: string | null;
  kycRef: string | null;
  kycDocUrl: string | null;
  kycVerified: boolean;
  claimAmount: number;
  status: SubsidyClaimStatus;
  voucherNo: string | null;
  approvedAt: string | null;
  disbursedAt: string | null;
  remarks: string | null;
};

export type SubsidyClaimsTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};

export type SubsidyClaimAnalytics = {
  open: number; // draft + submitted
  approved: number;
  disbursed: number;
  claimedValue: number; // total claimed (active)
  disbursedValue: number; // total paid out
  byStatus: { name: string; value: number }[];
};
