import { z } from "zod";

export const dealerFormSchema = z.object({
  code: z.string().trim().min(1, "Dealer code is required"),
  name: z.string().trim().min(1, "Name is required"),
  legalName: z.string().trim().optional(),
  contactPerson: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  gstin: z.string().trim().optional(),
  addressLine1: z.string().trim().optional(),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  country: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  disabled: z.boolean(),
});

export type DealerFormValues = z.infer<typeof dealerFormSchema>;

export const emptyDealer: DealerFormValues = {
  code: "",
  name: "",
  legalName: "",
  contactPerson: "",
  phone: "",
  email: "",
  gstin: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  disabled: false,
};

export type Dealer = {
  id: string;
  code: string;
  name: string;
  legalName: string | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  disabled: boolean;
  vehicleCount: number;
};

export type DealerOption = {
  id: string;
  code: string;
  name: string;
};

export type DealersTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};
