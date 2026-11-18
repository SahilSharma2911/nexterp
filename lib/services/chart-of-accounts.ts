import type { Prisma, RootType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type {
  Account,
  AccountFormValues,
} from "@/features/chart-of-accounts/schema";

const SORTABLE = ["accountName", "rootType", "accountType", "createdAt"] as const;

// The standard opening chart (ported from the legacy seed action).
const STANDARD: { accountName: string; accountType: string; rootType: RootType }[] =
  [
    { accountName: "Debtors", accountType: "Receivable", rootType: "ASSET" },
    { accountName: "Cash", accountType: "Cash", rootType: "ASSET" },
    { accountName: "Bank", accountType: "Bank", rootType: "ASSET" },
    { accountName: "Creditors", accountType: "Payable", rootType: "LIABILITY" },
    { accountName: "Sales", accountType: "Income Account", rootType: "INCOME" },
    {
      accountName: "Service Income",
      accountType: "Income Account",
      rootType: "INCOME",
    },
    {
      accountName: "Vehicle Sales",
      accountType: "Income Account",
      rootType: "INCOME",
    },
    {
      accountName: "Accessory Sales",
      accountType: "Income Account",
      rootType: "INCOME",
    },
    {
      accountName: "Cost of Goods Sold",
      accountType: "Expense Account",
      rootType: "EXPENSE",
    },
  ];

type Row = Prisma.AccountGetPayload<object>;

function toItem(r: Row): Account {
  return {
    id: r.id,
    accountName: r.accountName,
    accountType: r.accountType,
    rootType: r.rootType,
    disabled: r.disabled,
  };
}

function toData(v: AccountFormValues) {
  return {
    accountName: v.accountName.trim(),
    accountType: v.accountType?.trim() || null,
    rootType: v.rootType as RootType,
    disabled: v.disabled,
  };
}

export async function listAccounts(
  p: ListParams,
): Promise<ListResponse<Account>> {
  const where: Prisma.AccountWhereInput = p.search
    ? {
        OR: [
          { accountName: { contains: p.search, mode: "insensitive" } },
          { accountType: { contains: p.search, mode: "insensitive" } },
        ],
      }
    : {};
  const orderBy = parseSort(p.sort, SORTABLE, { accountName: "asc" });

  const [rows, total] = await Promise.all([
    prisma.account.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
    }),
    prisma.account.count({ where }),
  ]);

  return { rows: rows.map(toItem), total, page: p.page, limit: p.limit };
}

export async function accountOptions() {
  const rows = await prisma.account.findMany({
    where: { disabled: false },
    orderBy: { accountName: "asc" },
    select: { id: true, accountName: true, rootType: true, accountType: true },
  });
  return rows;
}

export async function getAccountById(id: string): Promise<Account | null> {
  const r = await prisma.account.findUnique({ where: { id } });
  return r ? toItem(r) : null;
}

export async function createAccount(
  values: AccountFormValues,
): Promise<Account> {
  const name = values.accountName.trim();
  const dupe = await prisma.account.findUnique({ where: { accountName: name } });
  if (dupe) throw new Error(`Account "${name}" already exists`);
  const r = await prisma.account.create({ data: toData(values) });
  return toItem(r);
}

export async function updateAccount(
  id: string,
  values: AccountFormValues,
): Promise<Account> {
  const existing = await prisma.account.findUnique({ where: { id } });
  if (!existing) throw new Error("Account not found");
  const name = values.accountName.trim();
  if (name !== existing.accountName) {
    const dupe = await prisma.account.findUnique({
      where: { accountName: name },
    });
    if (dupe) throw new Error(`Account "${name}" already exists`);
  }
  const r = await prisma.account.update({ where: { id }, data: toData(values) });
  return toItem(r);
}

export async function deleteAccount(id: string): Promise<void> {
  try {
    await prisma.account.delete({ where: { id } });
  } catch {
    throw new Error(
      "Can't delete — this account has ledger entries. Disable it instead.",
    );
  }
}

export async function seedStandardChart(): Promise<{ created: number }> {
  let created = 0;
  for (const a of STANDARD) {
    const existing = await prisma.account.findUnique({
      where: { accountName: a.accountName },
    });
    if (!existing) {
      await prisma.account.create({ data: a });
      created++;
    }
  }
  return { created };
}
