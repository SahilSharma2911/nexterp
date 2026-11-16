import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type {
  UserCreateValues,
  UserRow,
  UserUpdateValues,
} from "@/features/users/schema";

const SORTABLE = ["name", "email", "role", "createdAt"] as const;

type Row = Prisma.UserGetPayload<object>;

function toRow(r: Row): UserRow {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    disabled: r.disabled,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function listUsers(
  p: ListParams,
): Promise<ListResponse<UserRow>> {
  const where: Prisma.UserWhereInput = p.search
    ? {
        OR: [
          { name: { contains: p.search, mode: "insensitive" } },
          { email: { contains: p.search, mode: "insensitive" } },
        ],
      }
    : {};
  const orderBy = parseSort(p.sort, SORTABLE, { createdAt: "desc" });

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { rows: rows.map(toRow), total, page: p.page, limit: p.limit };
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const r = await prisma.user.findUnique({ where: { id } });
  return r ? toRow(r) : null;
}

export async function createUser(v: UserCreateValues): Promise<UserRow> {
  const email = v.email.trim().toLowerCase();
  const dupe = await prisma.user.findUnique({ where: { email } });
  if (dupe) throw new Error(`A user with email ${email} already exists`);
  const r = await prisma.user.create({
    data: {
      name: v.name.trim(),
      email,
      role: v.role,
      disabled: v.disabled,
      passwordHash: await hashPassword(v.password),
    },
  });
  return toRow(r);
}

export async function updateUser(
  id: string,
  v: UserUpdateValues,
): Promise<UserRow> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new Error("User not found");

  const email = v.email.trim().toLowerCase();
  if (email !== existing.email) {
    const dupe = await prisma.user.findUnique({ where: { email } });
    if (dupe) throw new Error(`A user with email ${email} already exists`);
  }

  const data: Prisma.UserUpdateInput = {
    name: v.name.trim(),
    email,
    role: v.role,
    disabled: v.disabled,
  };
  if (v.password) data.passwordHash = await hashPassword(v.password);

  const r = await prisma.user.update({ where: { id }, data });
  return toRow(r);
}

export async function deleteUser(id: string): Promise<void> {
  await prisma.user.delete({ where: { id } });
}
