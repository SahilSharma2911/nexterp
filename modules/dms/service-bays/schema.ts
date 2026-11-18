import { z } from "zod";

export const serviceBayFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  isHV: z.boolean(),
  active: z.boolean(),
});

export type ServiceBayFormValues = z.infer<typeof serviceBayFormSchema>;

export const emptyServiceBay: ServiceBayFormValues = {
  name: "",
  isHV: false,
  active: true,
};

export type ServiceBay = {
  id: string;
  name: string;
  isHV: boolean;
  active: boolean;
  jobCount: number;
};

export type ServiceBayOption = {
  id: string;
  name: string;
  isHV: boolean;
};

export type ServiceBaysTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};
