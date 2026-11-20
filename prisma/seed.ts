/**
 * Foundation seed for nexterp (EV dealership build).
 *
 * Keeps it lean and vehicle-focused: admin login, the standard chart of
 * accounts (incl. Vehicle/Accessory/Service income) and an opening cash float.
 * No generic ERP demo stock — the dealership demo (spare parts, accessories,
 * vehicles, dealers, job cards…) lives in `npm run seed:dms`.
 *
 * Run:  npm run db:seed   (then:  npm run seed:dms)
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { postGL, getAccountId } from "../lib/gl";
import { seedStandardChart } from "../lib/services/chart-of-accounts";

const now = new Date();

async function wipe() {
  // Children → parents. Clears any legacy generic-ERP demo data too.
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
  await prisma.account.deleteMany();
  await prisma.item.deleteMany();
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

  // Standard chart of accounts (Debtors, Cash, Bank, Sales, Vehicle Sales,
  // Accessory Sales, Service Income, …) + an equity account for the opening float.
  await seedStandardChart();
  await prisma.account.upsert({
    where: { accountName: "Opening Balance Equity" },
    update: {},
    create: {
      accountName: "Opening Balance Equity",
      accountType: null,
      rootType: "EQUITY",
    },
  });

  // Opening cash float (double-entry: Dr Cash / Cr Opening Balance Equity).
  await prisma.$transaction(async (tx) => {
    const cash = await getAccountId(tx, "Cash");
    const eq = await getAccountId(tx, "Opening Balance Equity");
    await postGL(tx, {
      lines: [
        { accountId: cash, debit: 50000 },
        { accountId: eq, credit: 50000 },
      ],
      voucherType: "Journal Entry",
      voucherNo: "OPEN-2026-00001",
      postingAt: now,
      remarks: "Opening balance",
    });
  });

  console.log(
    "Seeded foundation: admin login, chart of accounts, opening cash.",
  );
  console.log("Next: `npm run seed:dms` for the dealership demo data.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
