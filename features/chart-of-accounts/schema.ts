import { z } from "zod";

export const ROOT_TYPES = [
  "ASSET",
  "LIABILITY",
  "INCOME",
  "EXPENSE",
  "EQUITY",
] as const;

// Common ERPNext-style account types, offered as a datalist (free text).
export const ACCOUNT_TYPES = [
  "Receivable",
  "Payable",
  "Cash",
  "Bank",
  "Income Account",
  "Expense Account",
  "Stock",
  "Tax",
  "Fixed Asset",
  "Equity",
];

export const accountFormSchema = z.object({
  accountName: z.string().trim().min(1, "Account Name is required"),
  accountType: z.string().trim().optional(),
  rootType: z.enum(ROOT_TYPES),
  disabled: z.boolean(),
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;

export const emptyAccount: AccountFormValues = {
  accountName: "",
  accountType: "",
  rootType: "ASSET",
  disabled: false,
};

export type Account = {
  id: string;
  accountName: string;
  accountType: string | null;
  rootType: string;
  disabled: boolean;
};

export type AccountOption = {
  id: string;
  accountName: string;
  rootType: string;
  accountType: string | null;
};

export type AccountsTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};
