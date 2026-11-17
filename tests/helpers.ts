import { prisma } from "@/lib/prisma";
import { postStockLedger } from "@/lib/stock-ledger";

// Wipe everything the DMS + the core engines it uses can touch, in FK order.
export async function resetDb() {
  await prisma.subsidyClaim.deleteMany();
  await prisma.subsidyScheme.deleteMany();
  await prisma.warrantyClaim.deleteMany();
  await prisma.warranty.deleteMany();
  await prisma.jobCard.deleteMany(); // cascades parts + labor
  await prisma.vehicle.deleteMany();
  await prisma.dealer.deleteMany();
  await prisma.gLEntry.deleteMany();
  await prisma.stockLedgerEntry.deleteMany();
  await prisma.bin.deleteMany();
  await prisma.account.deleteMany();
  await prisma.item.deleteMany();
  await prisma.warehouse.deleteMany();
}

export function makeWarehouse(name = "Test Store") {
  return prisma.warehouse.create({ data: { warehouseName: name } });
}

export function makeItem(itemCode = "PART-1", rate = 100) {
  return prisma.item.create({
    data: { itemCode, itemName: `Item ${itemCode}`, valuationRate: rate },
  });
}

// The accounts the DMS job card + others post to.
export async function seedAccounts() {
  const rows: [string, string, string][] = [
    ["Debtors", "Receivable", "ASSET"],
    ["Sales", "Income Account", "INCOME"],
    ["Service Income", "Income Account", "INCOME"],
    ["Creditors", "Payable", "LIABILITY"],
    ["Bank", "Bank", "ASSET"],
    ["Cash", "Cash", "ASSET"],
    ["Cost of Goods Sold", "Expense Account", "EXPENSE"],
  ];
  for (const [accountName, accountType, rootType] of rows) {
    await prisma.account.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { accountName, accountType, rootType: rootType as any },
    });
  }
}

// Receive stock so a later issue won't fail on insufficient balance.
export async function stockIn(
  itemId: string,
  warehouseId: string,
  qty: number,
  rate: number,
) {
  await prisma.$transaction(async (tx) => {
    await postStockLedger(tx, {
      itemId,
      warehouseId,
      actualQty: qty,
      incomingRate: rate,
      voucherType: "Opening",
      voucherNo: "TEST-IN",
      postingAt: new Date(),
    });
  });
}

export async function binQty(itemId: string, warehouseId: string) {
  const bin = await prisma.bin.findUnique({
    where: { itemId_warehouseId: { itemId, warehouseId } },
  });
  return bin?.actualQty ?? 0;
}

export async function glFor(voucherNo: string) {
  return prisma.gLEntry.findMany({
    where: { voucherNo },
    include: { account: { select: { accountName: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export function makeVehicle(vin = "VIN-TEST-1", extra: Record<string, unknown> = {}) {
  return prisma.vehicle.create({
    data: { vin, model: "Test EV", status: "IN_STOCK", ...extra },
  });
}
