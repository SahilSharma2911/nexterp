import { z } from "zod";

export const technicianFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  skills: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  isHVCertified: z.boolean(),
  active: z.boolean(),
});

export type TechnicianFormValues = z.infer<typeof technicianFormSchema>;

export const emptyTechnician: TechnicianFormValues = {
  name: "",
  skills: "",
  phone: "",
  isHVCertified: false,
  active: true,
};

export type Technician = {
  id: string;
  name: string;
  skills: string | null;
  phone: string | null;
  isHVCertified: boolean;
  active: boolean;
  jobCount: number;
};

export type TechnicianOption = {
  id: string;
  name: string;
  isHVCertified: boolean;
};

export type TechniciansTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};
