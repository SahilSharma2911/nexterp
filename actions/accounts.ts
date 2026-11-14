"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { RootType } from "@prisma/client";

const STANDARD: { accountName: string; accountType: string; rootType: RootType }[] = [
  { accountName: "Debtors", accountType: "Receivable", rootType: "ASSET" },
  { accountName: "Cash", accountType: "Cash", rootType: "ASSET" },
  { accountName: "Bank", accountType: "Bank", rootType: "ASSET" },
  { accountName: "Creditors", accountType: "Payable", rootType: "LIABILITY" },
  { accountName: "Sales", accountType: "Income Account", rootType: "INCOME" },
  { accountName: "Cost of Goods Sold", accountType: "Expense Account", rootType: "EXPENSE" },
];

export async function seedChartOfAccounts() {
  for (const a of STANDARD) {
    await prisma.account.upsert({ where: { accountName: a.accountName }, update: {}, create: a });
  }
  revalidatePath("/accounts/chart");
  return { ok: true };
}

export async function upsertAccount(input: { id?: string; accountName: string; accountType?: string; rootType: RootType; disabled?: boolean }) {
  if (!input.accountName?.trim()) throw new Error("Account Name is required");
  const data = { accountName: input.accountName.trim(), accountType: input.accountType?.trim() || null, rootType: input.rootType, disabled: !!input.disabled };
  let id = input.id;
  if (id) await prisma.account.update({ where: { id }, data });
  else {
    const dupe = await prisma.account.findUnique({ where: { accountName: data.accountName } });
    if (dupe) throw new Error(`Account "${data.accountName}" already exists`);
    id = (await prisma.account.create({ data })).id;
  }
  revalidatePath("/accounts/chart");
  return { ok: true, id };
}

export async function getAccounts() {
  const rows = await prisma.account.findMany({ orderBy: [{ rootType: "asc" }, { accountName: "asc" }] });
  return rows.map((a) => ({ id: a.id, accountName: a.accountName, accountType: a.accountType, rootType: a.rootType, disabled: a.disabled }));
}

export async function getAccountOptions() {
  const rows = await prisma.account.findMany({ where: { disabled: false }, orderBy: { accountName: "asc" }, select: { id: true, accountName: true, rootType: true, accountType: true } });
  return rows.map((a) => ({ id: a.id, accountName: a.accountName, rootType: a.rootType, accountType: a.accountType }));
}
