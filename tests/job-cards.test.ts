import { describe, it, expect, beforeEach } from "vitest";
import {
  createJobCard,
  completeJobCard,
  cancelJobCard,
  updateJobCard,
  getJobCard,
} from "@/lib/services/job-cards";
import { prisma } from "@/lib/prisma";
import {
  resetDb,
  seedAccounts,
  makeWarehouse,
  makeItem,
  makeVehicle,
  stockIn,
  binQty,
  glFor,
} from "./helpers";

type Ctx = { vehicleId: string; warehouseId: string; itemId: string };

async function ctx(stock = 100): Promise<Ctx> {
  await seedAccounts();
  const wh = await makeWarehouse();
  const item = await makeItem("WHEEL", 50);
  await stockIn(item.id, wh.id, stock, 50);
  const v = await makeVehicle("VIN-JOB");
  return { vehicleId: v.id, warehouseId: wh.id, itemId: item.id };
}

const jobForm = (c: Ctx, over: Record<string, unknown> = {}) => ({
  vehicleId: c.vehicleId,
  warehouseId: c.warehouseId,
  complaint: "service",
  technician: "Ravi",
  odometer: 10000,
  serviceDate: "2026-11-17",
  parts: [{ itemId: c.itemId, qty: 2, rate: 500 }],
  labor: [{ description: "General service", hours: 1.5, rate: 400 }],
  photos: [],
  remarks: "",
  ...over,
});

describe("job cards service", () => {
  beforeEach(resetDb);

  it("computes parts, labour and grand totals", async () => {
    const c = await ctx();
    const { id } = await createJobCard(jobForm(c));
    const job = await getJobCard(id);
    expect(job?.partsTotal).toBe(1000);
    expect(job?.laborTotal).toBe(600);
    expect(job?.total).toBe(1600);
  });

  it("on complete: issues parts to the stock ledger and posts GL", async () => {
    const c = await ctx(100);
    const { id, name } = await createJobCard(jobForm(c));
    await completeJobCard(id);

    expect(await binQty(c.itemId, c.warehouseId)).toBe(98); // 100 - 2

    const gl = await glFor(name);
    const debtor = gl.find((g) => g.account.accountName === "Debtors");
    const income = gl.find((g) => g.account.accountName === "Service Income");
    expect(Number(debtor?.debit)).toBe(1600);
    expect(Number(income?.credit)).toBe(1600);
    expect((await getJobCard(id))?.status).toBe("COMPLETED");
  });

  it("on cancel: reverses the stock and the GL", async () => {
    const c = await ctx(100);
    const { id, name } = await createJobCard(jobForm(c));
    await completeJobCard(id);
    await cancelJobCard(id);

    expect(await binQty(c.itemId, c.warehouseId)).toBe(100); // restored

    const gl = await glFor(name);
    const dr = gl.reduce((s, g) => s + Number(g.debit), 0);
    const cr = gl.reduce((s, g) => s + Number(g.credit), 0);
    expect(dr).toBe(cr); // balanced after reversal
    expect(gl.every((g) => g.isCancelled)).toBe(true);
    expect((await getJobCard(id))?.status).toBe("CANCELLED");
  });

  it("refuses to complete with parts but no warehouse", async () => {
    const c = await ctx();
    const { id } = await createJobCard(jobForm(c, { warehouseId: "" }));
    await expect(completeJobCard(id)).rejects.toThrow(/warehouse/i);
  });

  it("refuses to complete with insufficient stock", async () => {
    const c = await ctx(1); // only 1 in stock, job needs 2
    const { id } = await createJobCard(jobForm(c));
    await expect(completeJobCard(id)).rejects.toThrow(/insufficient|stock/i);
  });

  it("only draft job cards can be edited", async () => {
    const c = await ctx();
    const { id } = await createJobCard(jobForm(c));
    await completeJobCard(id);
    await expect(updateJobCard(id, jobForm(c))).rejects.toThrow(/open/i);
  });

  it("stores workshop photos", async () => {
    const c = await ctx();
    const { id } = await createJobCard(
      jobForm(c, { photos: ["/uploads/a.jpg", "/uploads/b.jpg"] }),
    );
    expect((await getJobCard(id))?.photos).toEqual([
      "/uploads/a.jpg",
      "/uploads/b.jpg",
    ]);
  });

  it("a labour-only job posts GL and issues nothing", async () => {
    const c = await ctx();
    const { id, name } = await createJobCard(
      jobForm(c, { parts: [], warehouseId: "" }),
    );
    await completeJobCard(id);
    const gl = await glFor(name);
    expect(Number(gl.find((g) => g.account.accountName === "Debtors")?.debit)).toBe(600);
    // no stock ledger entries for a parts-free job
    const sle = await prisma.stockLedgerEntry.count({ where: { voucherNo: name } });
    expect(sle).toBe(0);
  });
});
