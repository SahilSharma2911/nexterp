import { z } from "zod";

export const supplierFormSchema = z.object({
  supplierName: z.string().trim().min(1, "Supplier Name is required"),
  supplierGroup: z.string().trim().optional(),
  disabled: z.boolean(),
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;

export const emptySupplier: SupplierFormValues = {
  supplierName: "",
  supplierGroup: "",
  disabled: false,
};

export type Supplier = {
  id: string;
  supplierName: string;
  supplierGroup: string | null;
  disabled: boolean;
};

export type SupplierOption = {
  id: string;
  supplierName: string;
};

export type SuppliersTableMeta = {
  sort: string;
  onSort: (field: string) => void;
  onEdit: (supplier: Supplier) => void;
};
