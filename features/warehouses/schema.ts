import { z } from "zod";

export const WAREHOUSE_TYPES = [
  "Stores",
  "Raw Material",
  "Work In Progress",
  "Finished Goods",
  "Transit",
  "Returns",
  "Rejected",
  "Scrap",
];

export const warehouseFormSchema = z.object({
  warehouseName: z.string().trim().min(1, "Warehouse Name is required"),
  warehouseType: z.string().trim().optional(),
  addressLine1: z.string().trim().optional(),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  country: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  contactPerson: z.string().trim().optional(),
  disabled: z.boolean(),
});

export type WarehouseFormValues = z.infer<typeof warehouseFormSchema>;

export const emptyWarehouse: WarehouseFormValues = {
  warehouseName: "",
  warehouseType: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  phone: "",
  email: "",
  contactPerson: "",
  disabled: false,
};

export type Warehouse = {
  id: string;
  warehouseName: string;
  warehouseType: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
  contactPerson: string | null;
  disabled: boolean;
};

export type WarehouseOption = {
  id: string;
  warehouseName: string;
};

export type WarehousesTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};
