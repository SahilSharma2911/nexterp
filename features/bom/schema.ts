import { z } from "zod";

export const bomComponentSchema = z.object({
  itemId: z.string().min(1, "Select an item"),
  qty: z.number().positive("Qty must be > 0"),
  rate: z.number().min(0, "Rate must be ≥ 0"),
});

export const bomFormSchema = z
  .object({
    itemId: z.string().min(1, "Select the finished item"),
    quantity: z.number().positive("Quantity must be > 0"),
    remarks: z.string().trim().optional(),
    items: z.array(bomComponentSchema).min(1, "Add at least one component"),
  })
  .superRefine((v, ctx) => {
    v.items.forEach((it, i) => {
      if (it.itemId && it.itemId === v.itemId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A component can't be the finished item",
          path: ["items", i, "itemId"],
        });
      }
    });
  });

export type BomFormValues = z.infer<typeof bomFormSchema>;

export const emptyBomComponent = { itemId: "", qty: 1, rate: 0 };

export const emptyBom: BomFormValues = {
  itemId: "",
  quantity: 1,
  remarks: "",
  items: [{ ...emptyBomComponent }],
};

// ---- read models ----

export type BomListItem = {
  id: string;
  name: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  status: string;
  isDefault: boolean;
  isActive: boolean;
  componentCount: number;
  totalCost: number;
};

export type BomComponent = {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
};

export type BomExplosion = {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  qty: number;
  rate: number;
  amount: number;
};

export type BomDetail = {
  id: string;
  name: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  uom: string;
  status: string;
  isDefault: boolean;
  isActive: boolean;
  totalCost: number;
  remarks: string | null;
  items: BomComponent[];
  explosionItems: BomExplosion[];
};

export type BomOption = {
  id: string;
  name: string;
  itemCode: string;
  itemName: string;
  quantity: number;
};

export type BomsTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};
