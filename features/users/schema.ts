import { z } from "zod";
import { ROLE_VALUES, type Role } from "@/lib/permissions";

export { ROLES } from "@/lib/permissions";

const roleEnum = z.enum(ROLE_VALUES);

// Shared base. Password rules differ between create and edit, so each exposes
// its own schema.
const base = {
  name: z.string().trim().min(1, "Name is required"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email"),
  role: roleEnum,
  disabled: z.boolean(),
};

export const userCreateSchema = z.object({
  ...base,
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const userUpdateSchema = z.object({
  ...base,
  // Blank = keep the current password.
  password: z
    .string()
    .refine((v) => v === "" || v.length >= 6, "Password must be at least 6 characters"),
});

// The form reuses the update schema (password optional); create-time requirement
// is enforced in the component.
export const userFormSchema = userUpdateSchema;

export type UserCreateValues = z.infer<typeof userCreateSchema>;
export type UserUpdateValues = z.infer<typeof userUpdateSchema>;
export type UserFormValues = z.infer<typeof userFormSchema>;

export const emptyUser: UserFormValues = {
  name: "",
  email: "",
  role: "VIEWER",
  password: "",
  disabled: false,
};

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  disabled: boolean;
  createdAt: string;
};

export type UsersTableMeta = {
  sort: string;
  onSort: (field: string) => void;
};
