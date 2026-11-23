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
  faultCode: z.string().trim().optional(),
  description: z.string().trim().optional(),
  claimAmount: z.number().min(0, "Must be ≥ 0"),
  remarks: z.string().trim().optional(),
});

export type ClaimFormValues = z.infer<typeof claimFormSchema>;

export const emptyClaim: ClaimFormValues = {
  warrantyId: "",
  jobCardId: "",
  claimDate: "",
  faultCode: "",
  description: "",
  claimAmount: 0,
  remarks: "",
};

export type CheckStatus = "pass" | "fail" | "warn" | "na";
export type EligibilityCheck = {
  key: string;
  label: string;
  status: CheckStatus;
  detail: string;
};

// Full automated-eligibility result shown on the claim + vehicle/job context.
export type ClaimEligibility = {
  eligible: boolean;
  preQualified: boolean;
  note: string;
  checks: EligibilityCheck[];
  coverage: {
    component: string;
    startDate: string;
    expiryDate: string;
    months: number;
    kmLimit: number | null;
    soHThreshold: number | null;
    status: string;
  };
  vehicle: {
    id: string;
    vin: string;
    model: string;
    batterySoH: number | null;
    odometerKm: number | null;
    customerName: string | null;
  };
  job: { id: string; name: string; serviceDate: string; odometer: number | null } | null;
  faultCode: string | null;
  lastServiceAt: string | null;
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
  faultCode: string | null;
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

export type ClaimAnalytics = {
  open: number; // draft + submitted (in the OEM pipeline)
  approved: number;
  settled: number;
  claimedValue: number; // total claimed (active claims)
  approvedValue: number; // total approved by OEM
  byStatus: { name: string; value: number }[];
};
