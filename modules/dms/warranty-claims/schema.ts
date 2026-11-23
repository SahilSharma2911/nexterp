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
  laborCode: z.string().trim().optional(),
  diagnosis: z.string().trim().optional(),
  partsNeeded: z.string().trim().optional(),
  evidence: z.array(z.string().trim().min(1)).optional(),
  documents: z.array(z.string().trim().min(1)).optional(),
  description: z.string().trim().optional(),
  claimAmount: z.number().min(0, "Must be ≥ 0"),
  expectedReimburseAt: z.string().optional().nullable(),
  remarks: z.string().trim().optional(),
});

export type ClaimFormValues = z.infer<typeof claimFormSchema>;

export const emptyClaim: ClaimFormValues = {
  warrantyId: "",
  jobCardId: "",
  claimDate: "",
  faultCode: "",
  laborCode: "",
  diagnosis: "",
  partsNeeded: "",
  evidence: [],
  documents: [],
  description: "",
  claimAmount: 0,
  expectedReimburseAt: "",
  remarks: "",
};

export const CLAIM_EVENT_KINDS = [
  "CREATED",
  "SUBMITTED",
  "COMMENT",
  "APPROVED",
  "REJECTED",
  "SETTLED",
  "REIMBURSED",
  "NOTE",
] as const;
export type ClaimEventKind = (typeof CLAIM_EVENT_KINDS)[number];

export type ClaimEvent = {
  id: string;
  kind: ClaimEventKind;
  note: string | null;
  by: string | null;
  at: string;
};

export type ClaimCreditNote = {
  id: string;
  number: string;
  amount: number;
  noteDate: string;
  status: "UNMATCHED" | "MATCHED" | "DISCREPANCY";
};

// Defaults pulled from a job card to pre-populate a new claim.
export type ClaimJobDefaults = {
  jobCardId: string;
  jobCard: string;
  warrantyId: string | null;
  faultCode: string | null;
  diagnosis: string | null;
  partsNeeded: string | null;
  description: string | null;
  claimAmount: number;
  photos: string[];
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
  laborCode: string | null;
  diagnosis: string | null;
  partsNeeded: string | null;
  evidence: string[];
  documents: string[];
  description: string | null;
  status: ClaimStatus;
  claimAmount: number;
  approvedAmount: number;
  reimbursedAmount: number;
  outstanding: number; // approved − reimbursed (once approved)
  oemRef: string | null;
  expectedReimburseAt: string | null;
  submittedAt: string | null;
  settledAt: string | null;
  eligible: boolean | null;
  eligibilityNote: string | null;
  remarks: string | null;
  events: ClaimEvent[];
  creditNotes: ClaimCreditNote[];
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
