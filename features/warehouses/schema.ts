import { z } from "zod";

export const warehouseFormSchema = z.object({
  warehouseName: z.string().trim().min(1, "Warehouse Name is required"),
  warehouseType: z.string().trim().optional(),
  disabled: z.boolean(),
});

export type WarehouseFormValues = z.infer<typeof warehouseFormSchema>;

export const emptyWarehouse: WarehouseFormValues = {
  warehouseName: "",
  warehouseType: "",
  disabled: false,
};

export type Warehouse = {
  id: string;
  warehouseName: string;
  warehouseType: string | null;
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
