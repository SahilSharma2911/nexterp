import { z } from "zod";

export const customerFormSchema = z.object({
  customerName: z.string().trim().min(1, "Customer Name is required"),
  customerGroup: z.string().trim().optional(),
  territory: z.string().trim().optional(),
  disabled: z.boolean(),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

export const emptyCustomer: CustomerFormValues = {
  customerName: "",
  customerGroup: "",
  territory: "",
  disabled: false,
};

export type Customer = {
  id: string;
  customerName: string;
  customerGroup: string | null;
  territory: string | null;
  disabled: boolean;
};

export type CustomerOption = {
  id: string;
  customerName: string;
};

export type CustomersTableMeta = {
  sort: string;
  onSort: (field: string) => void;
  onEdit: (customer: Customer) => void;
};
