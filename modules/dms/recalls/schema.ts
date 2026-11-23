import { z } from "zod";

export const RECALL_STATUSES = ["OPEN", "CLOSED"] as const;
export type RecallStatus = (typeof RECALL_STATUSES)[number];
export const RECALL_STATUS_LABELS: Record<RecallStatus, string> = {
  OPEN: "Open",
  CLOSED: "Closed",
};

export const RECALL_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type RecallSeverity = (typeof RECALL_SEVERITIES)[number];
export const SEVERITY_LABELS: Record<RecallSeverity, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const RECALL_ITEM_STATUSES = [
  "PENDING",
  "NOTIFIED",
  "REPAIRED",
  "NOT_AFFECTED",
] as const;
export type RecallItemStatus = (typeof RECALL_ITEM_STATUSES)[number];
export const ITEM_STATUS_LABELS: Record<RecallItemStatus, string> = {
  PENDING: "Pending",
  NOTIFIED: "Notified",
  REPAIRED: "Repaired",
  NOT_AFFECTED: "Not affected",
};

export const recallFormSchema = z.object({
  code: z.string().trim().optional(),
  title: z.string().trim().min(1, "Title is required"),
  component: z.string().trim().optional(),
  severity: z.enum(RECALL_SEVERITIES),
  description: z.string().trim().optional(),
  models: z.array(z.string().trim().min(1)),
  mfgFrom: z.string().optional().nullable(),
  mfgTo: z.string().optional().nullable(),
});

export type RecallFormValues = z.infer<typeof recallFormSchema>;

export const emptyRecall: RecallFormValues = {
  code: "",
  title: "",
  component: "",
  severity: "MEDIUM",
  description: "",
  models: [],
  mfgFrom: "",
  mfgTo: "",
};

export type RecallListItem = {
  id: string;
  code: string;
  title: string;
  component: string | null;
  severity: RecallSeverity;
  status: RecallStatus;
  models: string[];
  launchedAt: string;
  affected: number;
  repaired: number;
};

export type RecallItemRow = {
  id: string;
  vehicleId: string;
  vin: string;
  model: string;
  customerName: string | null;
  status: RecallItemStatus;
  jobCardId: string | null;
  jobCard: string | null;
  notifiedAt: string | null;
  repairedAt: string | null;
  notes: string | null;
};

export type RecallDetail = {
  id: string;
  code: string;
  title: string;
  component: string | null;
  severity: RecallSeverity;
  status: RecallStatus;
  description: string | null;
  models: string[];
  mfgFrom: string | null;
  mfgTo: string | null;
  launchedAt: string;
  closedAt: string | null;
  items: RecallItemRow[];
  summary: {
    affected: number;
    pending: number;
    notified: number;
    repaired: number;
    notAffected: number;
    completionPct: number; // repaired / affected
  };
};

export type RecallAnalytics = {
  openCampaigns: number;
  affectedVehicles: number;
  pending: number;
  repaired: number;
  completionPct: number;
  bySeverity: { name: string; value: number }[];
};

export type RecallsTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};
