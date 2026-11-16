/**
 * Demo seed for nexterp. Wipes and repopulates a full, consistent dataset that
 * exercises every module, so the dashboard and reports look alive.
 * Run:  npm run db:seed   (reads DATABASE_URL from .env)
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { postStockLedger } from "../lib/stock-ledger";
import { postGL, getAccountId } from "../lib/gl";
import { adjustBinReservation } from "../lib/bin";

const now = new Date();
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

async function wipe() {
  // Children → parents.
  await prisma.gLEntry.deleteMany();
  await prisma.paymentEntry.deleteMany();
  await prisma.salesInvoiceItem.deleteMany();
  await prisma.salesInvoice.deleteMany();
  await prisma.purchaseInvoiceItem.deleteMany();
  await prisma.purchaseInvoice.deleteMany();
  await prisma.deliveryNoteItem.deleteMany();
  await prisma.deliveryNote.deleteMany();
  await prisma.salesOrderItem.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.purchaseReceiptItem.deleteMany();
  await prisma.purchaseReceipt.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.workOrderItem.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.bomExplosionItem.deleteMany();
  await prisma.bomItem.deleteMany();
  await prisma.bom.deleteMany();
  await prisma.stockReconciliationItem.deleteMany();
  await prisma.stockReconciliation.deleteMany();
  await prisma.stockEntryDetail.deleteMany();
  await prisma.stockEntry.deleteMany();
  await prisma.stockLedgerEntry.deleteMany();
  await prisma.bin.deleteMany();
  await prisma.paymentEntry.deleteMany();
  await prisma.account.deleteMany();
  await prisma.item.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
}

async function main() {
  await wipe();

  // Default admin login (keeps existing users intact on re-seed).
  const adminEmail = process.env.ADMIN_EMAIL || "admin@nexterp.app";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
  });

  // ---- Chart of Accounts ----
  const chart = [
    ["Debtors", "Receivable", "ASSET"], ["Cash", "Cash", "ASSET"], ["Bank", "Bank", "ASSET"],
    ["Creditors", "Payable", "LIABILITY"], ["Sales", "Income Account", "INCOME"], ["Cost of Goods Sold", "Expense Account", "EXPENSE"],
    ["Opening Balance Equity", "", "EQUITY"],
  ] as const;
  for (const [accountName, accountType, rootType] of chart)
    await prisma.account.create({ data: { accountName, accountType: accountType || null, rootType: rootType as never } });

  // Opening cash float (double-entry: Dr Cash / Cr Opening Balance Equity).
  await prisma.$transaction(async (tx) => {
    const cash = await getAccountId(tx, "Cash"), eq = await getAccountId(tx, "Opening Balance Equity");
    await postGL(tx, { lines: [{ accountId: cash, debit: 50000 }, { accountId: eq, credit: 50000 }], voucherType: "Journal Entry", voucherNo: "OPEN-2026-00001", postingAt: now, remarks: "Opening balance" });
  });

  // ---- Warehouses ----
  const stores = await prisma.warehouse.create({ data: { warehouseName: "Stores", warehouseType: "Raw Material" } });
  const fg = await prisma.warehouse.create({ data: { warehouseName: "Finished Goods", warehouseType: "Store" } });

  // ---- Items ----
  const mk = (itemCode: string, itemName: string, rate: number, group: string) =>
    prisma.item.create({ data: { itemCode, itemName, valuationRate: rate, itemGroup: group } });
  const wheel = await mk("WHEEL", "Castor Wheel", 50, "Components");
  const gas = await mk("GASCYL", "Gas Cylinder", 400, "Components");
  const foam = await mk("FOAM", "Moulded Foam", 120, "Materials");
  const fabric = await mk("FABRIC", "Upholstery Fabric", 300, "Materials");
  const base = await mk("CHAIR-BASE", "Chair Base (sub-assembly)", 0, "Sub Assemblies");
  const chair = await mk("CHAIR", "Office Chair", 0, "Finished Goods");
  const paper = await mk("A4-PAPER", "A4 Paper Ream", 250, "Trading");
  const stapler = await mk("STAPLER", "Stapler", 150, "Trading");

  // ---- Parties ----
  const acme = await prisma.supplier.create({ data: { supplierName: "Acme Components", supplierGroup: "Manufacturers" } });
  const global = await prisma.supplier.create({ data: { supplierName: "Global Supplies", supplierGroup: "Distributors" } });
  const zenith = await prisma.customer.create({ data: { customerName: "Zenith Retail", customerGroup: "Retail", territory: "North" } });
  const metro = await prisma.customer.create({ data: { customerName: "Metro Stores", customerGroup: "Wholesale", territory: "West" } });

  // ---- Receive raw materials (Purchase Receipt → stock in) ----
  const prLines: [string, string, number, number][] = [
    [wheel.id, "WHEEL", 150, 50], [gas.id, "GASCYL", 30, 400], [foam.id, "FOAM", 60, 120],
    [fabric.id, "FABRIC", 30, 300], [paper.id, "A4-PAPER", 200, 250], [stapler.id, "STAPLER", 100, 150],
  ];
  await prisma.$transaction(async (tx) => {
    const pr = await tx.purchaseReceipt.create({ data: { name: "PR-2026-00001", supplierId: acme.id, warehouseId: stores.id, status: "SUBMITTED", submittedAt: now, totalQty: prLines.reduce((s, l) => s + l[2], 0), totalAmount: round2(prLines.reduce((s, l) => s + l[2] * l[3], 0)) } });
    for (const [itemId, , qty, rate] of prLines) {
      await postStockLedger(tx, { itemId, warehouseId: stores.id, actualQty: qty, incomingRate: rate, voucherType: "Purchase Receipt", voucherNo: pr.name, postingAt: now });
      await tx.purchaseReceiptItem.create({ data: { purchaseReceiptId: pr.id, itemId, qty, rate, amount: round2(qty * rate) } });
    }
  });

  // ---- An open Purchase Order (reserves ordered qty) ----
  await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.create({ data: { name: "PO-2026-00001", supplierId: global.id, warehouseId: stores.id, status: "TO_FULFILL", submittedAt: now, totalQty: 100, totalAmount: 5000, items: { create: [{ itemId: wheel.id, qty: 100, rate: 50, amount: 5000 }] } } });
    await adjustBinReservation(tx, { itemId: wheel.id, warehouseId: stores.id, orderedDelta: 100 });
    void po;
  });

  // ---- BOMs (submitted, multi-level) ----
  const baseBom = await prisma.bom.create({ data: { name: "BOM-CHAIR-BASE-001", itemId: base.id, quantity: 1, status: "SUBMITTED", isDefault: true, submittedAt: now, totalCost: round2(5 * 50 + 1 * 400), items: { create: [{ itemId: wheel.id, qty: 5, rate: 50, amount: 250 }, { itemId: gas.id, qty: 1, rate: 400, amount: 400 }] }, explosionItems: { create: [{ itemId: wheel.id, qty: 5, rate: 50, amount: 250 }, { itemId: gas.id, qty: 1, rate: 400, amount: 400 }] } } });
  const chairCost = round2(650 + 2 * 120 + 1 * 300); // base 650 + foam 240 + fabric 300
  const chairBom = await prisma.bom.create({ data: { name: "BOM-CHAIR-001", itemId: chair.id, quantity: 1, status: "SUBMITTED", isDefault: true, submittedAt: now, totalCost: chairCost,
    items: { create: [{ itemId: base.id, qty: 1, rate: 650, amount: 650 }, { itemId: foam.id, qty: 2, rate: 120, amount: 240 }, { itemId: fabric.id, qty: 1, rate: 300, amount: 300 }] },
    explosionItems: { create: [{ itemId: wheel.id, qty: 5, rate: 50, amount: 250 }, { itemId: gas.id, qty: 1, rate: 400, amount: 400 }, { itemId: foam.id, qty: 2, rate: 120, amount: 240 }, { itemId: fabric.id, qty: 1, rate: 300, amount: 300 }] } } });
  void baseBom;

  // ---- Work Order: build 20 chairs (consume exploded raws, produce to FG) ----
  const woQty = 20;
  const exploded: [string, number][] = [[wheel.id, 5], [gas.id, 1], [foam.id, 2], [fabric.id, 1]];
  await prisma.$transaction(async (tx) => {
    const wo = await tx.workOrder.create({ data: { name: "WO-2026-00001", productionItemId: chair.id, bomId: chairBom.id, qty: woQty, producedQty: woQty, status: "COMPLETED", sourceWarehouseId: stores.id, fgWarehouseId: fg.id, items: { create: exploded.map(([itemId, q]) => ({ itemId, requiredQty: q * woQty, consumedQty: q * woQty, rate: 0 })) } } });
    const se = await tx.stockEntry.create({ data: { name: "SE-2026-00001", purpose: "MANUFACTURE", status: "SUBMITTED", submittedAt: now, workOrderId: wo.id, fromWarehouseId: stores.id, toWarehouseId: fg.id } });
    let consumed = 0;
    for (const [itemId, q] of exploded) {
      const r = await postStockLedger(tx, { itemId, warehouseId: stores.id, actualQty: -(q * woQty), voucherType: "Stock Entry", voucherNo: se.name, postingAt: now });
      consumed += Math.abs(r.stockValueDifference);
      await tx.stockEntryDetail.create({ data: { stockEntryId: se.id, itemId, sWarehouseId: stores.id, qty: q * woQty, valuationRate: r.valuationRate, amount: round2(Math.abs(r.stockValueDifference)) } });
    }
    const chairRate = consumed / woQty;
    await postStockLedger(tx, { itemId: chair.id, warehouseId: fg.id, actualQty: woQty, incomingRate: chairRate, voucherType: "Stock Entry", voucherNo: se.name, postingAt: now });
    await tx.stockEntryDetail.create({ data: { stockEntryId: se.id, itemId: chair.id, tWarehouseId: fg.id, qty: woQty, basicRate: chairRate, valuationRate: chairRate, amount: round2(consumed), isFinishedItem: true } });
    await tx.stockEntry.update({ where: { id: se.id }, data: { totalIncomingValue: round2(consumed), totalOutgoingValue: round2(consumed) } });
  });

  // ---- Sales Order + partial Delivery Note (chairs) ----
  await prisma.$transaction(async (tx) => {
    const so = await tx.salesOrder.create({ data: { name: "SO-2026-00001", customerId: zenith.id, warehouseId: fg.id, status: "TO_FULFILL", submittedAt: now, totalQty: 10, totalAmount: 15000, items: { create: [{ itemId: chair.id, qty: 10, rate: 1500, amount: 15000, deliveredQty: 6 }] } } });
    await adjustBinReservation(tx, { itemId: chair.id, warehouseId: fg.id, reservedDelta: 4 }); // 10 ordered - 6 delivered
    const dn = await tx.deliveryNote.create({ data: { name: "DN-2026-00001", customerId: zenith.id, warehouseId: fg.id, salesOrderId: so.id, status: "SUBMITTED", submittedAt: now, totalQty: 6, totalAmount: 9000 } });
    const r = await postStockLedger(tx, { itemId: chair.id, warehouseId: fg.id, actualQty: -6, voucherType: "Delivery Note", voucherNo: dn.name, postingAt: now });
    await tx.deliveryNoteItem.create({ data: { deliveryNoteId: dn.id, itemId: chair.id, qty: 6, rate: 1500, amount: 9000, valuationRate: r.valuationRate } });
    await tx.deliveryNote.update({ where: { id: dn.id }, data: { totalCogs: round2(Math.abs(r.stockValueDifference)) } });
  });

  // ---- Sales Invoice + partial payment ----
  await prisma.$transaction(async (tx) => {
    const si = await tx.salesInvoice.create({ data: { name: "SINV-2026-00001", customerId: zenith.id, status: "SUBMITTED", submittedAt: now, total: 9000, outstanding: 3000, items: { create: [{ itemId: chair.id, qty: 6, rate: 1500, amount: 9000 }] } } });
    const debtors = await getAccountId(tx, "Debtors"), sales = await getAccountId(tx, "Sales");
    await postGL(tx, { lines: [{ accountId: debtors, debit: 9000 }, { accountId: sales, credit: 9000 }], voucherType: "Sales Invoice", voucherNo: si.name, postingAt: now, againstParty: "Zenith Retail" });
    // Payment of 6000 (receive) → outstanding 3000.
    const bank = await getAccountId(tx, "Bank");
    const pe = await tx.paymentEntry.create({ data: { name: "PAY-2026-00001", paymentType: "RECEIVE", accountId: bank, customerId: zenith.id, salesInvoiceId: si.id, amount: 6000, status: "SUBMITTED", submittedAt: now } });
    await postGL(tx, { lines: [{ accountId: bank, debit: 6000 }, { accountId: debtors, credit: 6000 }], voucherType: "Payment Entry", voucherNo: pe.name, postingAt: now, againstParty: "Zenith Retail" });
  });

  // ---- Purchase Invoice + partial payment (raw materials bill) ----
  await prisma.$transaction(async (tx) => {
    const pi = await tx.purchaseInvoice.create({ data: { name: "PINV-2026-00001", supplierId: acme.id, status: "SUBMITTED", submittedAt: now, total: 20000, outstanding: 12000, items: { create: [{ itemId: wheel.id, qty: 150, rate: 50, amount: 7500 }, { itemId: gas.id, qty: 30, rate: 400, amount: 12000 }, { itemId: foam.id, qty: 4.17, rate: 120, amount: 500 }] } } });
    const expense = await getAccountId(tx, "Cost of Goods Sold"), creditors = await getAccountId(tx, "Creditors");
    await postGL(tx, { lines: [{ accountId: expense, debit: 20000 }, { accountId: creditors, credit: 20000 }], voucherType: "Purchase Invoice", voucherNo: pi.name, postingAt: now, againstParty: "Acme Components" });
    const cash = await getAccountId(tx, "Cash");
    const pe = await tx.paymentEntry.create({ data: { name: "PAY-2026-00002", paymentType: "PAY", accountId: cash, supplierId: acme.id, purchaseInvoiceId: pi.id, amount: 8000, status: "SUBMITTED", submittedAt: now } });
    await postGL(tx, { lines: [{ accountId: creditors, debit: 8000 }, { accountId: cash, credit: 8000 }], voucherType: "Payment Entry", voucherNo: pe.name, postingAt: now, againstParty: "Acme Components" });
  });

  const counts = {
    items: await prisma.item.count(), bins: await prisma.bin.count(), boms: await prisma.bom.count(),
    workOrders: await prisma.workOrder.count(), salesInvoices: await prisma.salesInvoice.count(), gl: await prisma.gLEntry.count(),
  };
  console.log("Seeded:", JSON.stringify(counts));
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
