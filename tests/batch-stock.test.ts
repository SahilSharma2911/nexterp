import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createBatch,
  deleteBatch,
} from "@/lib/services/batches";
import { allocateFefo, batchOnHand } from "@/lib/batch-stock";
import {
  createJobCard,
  completeJobCard,
  cancelJobCard,
} from "@/lib/services/job-cards";
import {
  resetDb,
  seedAccounts,
  makeWarehouse,
  makeVehicle,
  binQty,
} from "./helpers";

function batchItem(code = "BAT-1") {
  return prisma.item.create({
    data: {
      itemCode: code,
      itemName: `Batched ${code}`,
      valuationRate: 50,
      hasBatchNo: true,
    },
  });
}

const batchForm = (over: Record<string, unknown>) => ({
  itemId: "",
  warehouseId: "",
  batchNo: "L",
  barcode: "",
  mfgDate: "",
  expiryDate: "",
  qty: 0,
  supplier: "",
  notes: "",
  ...over,
});

describe("batch stock + FEFO", () => {
  beforeEach(resetDb);

  it("creating a batch with a warehouse posts a real receipt", async () => {
    const wh = await makeWarehouse();
    const item = await batchItem();
    const b = await createBatch(
      batchForm({ itemId: item.id, warehouseId: wh.id, batchNo: "L1", qty: 30 }),
    );
    expect(b.onHand).toBe(30);
    expect(await binQty(item.id, wh.id)).toBe(30);
  });

  it("no warehouse → no stock movement (on-hand 0)", async () => {
    const item = await batchItem();
    const b = await createBatch(
      batchForm({ itemId: item.id, batchNo: "L0", qty: 10 }),
    );
    expect(b.onHand).toBe(0);
  });

  it("FEFO consumes the earliest-expiry lot first", async () => {
    const wh = await makeWarehouse();
    const item = await batchItem();
    const later = await createBatch(
      batchForm({
        itemId: item.id,
        warehouseId: wh.id,
        batchNo: "LATE",
        qty: 10,
        expiryDate: "2027-12-01",
      }),
    );
    const soon = await createBatch(
      batchForm({
        itemId: item.id,
        warehouseId: wh.id,
        batchNo: "SOON",
        qty: 10,
        expiryDate: "2026-12-01",
      }),
    );
    const res = await prisma.$transaction((tx) =>
      allocateFefo(tx, item.id, wh.id, 12),
    );
    expect(res.shortfall).toBe(0);
    expect(res.alloc[0].batchId).toBe(soon.id);
    expect(res.alloc[0].qty).toBe(10);
    expect(res.alloc[1].batchId).toBe(later.id);
    expect(res.alloc[1].qty).toBe(2);
  });

  it("FEFO reports shortfall beyond batch stock", async () => {
    const wh = await makeWarehouse();
    const item = await batchItem();
    await createBatch(
      batchForm({
        itemId: item.id,
        warehouseId: wh.id,
        batchNo: "ONLY",
        qty: 5,
      }),
    );
    const res = await prisma.$transaction((tx) =>
      allocateFefo(tx, item.id, wh.id, 8),
    );
    expect(res.shortfall).toBe(3);
    expect(res.alloc[0].qty).toBe(5);
  });

  it("job card completion consumes batches FEFO; cancel restores them", async () => {
    await seedAccounts();
    const wh = await makeWarehouse();
    const item = await batchItem();
    const early = await createBatch(
      batchForm({
        itemId: item.id,
        warehouseId: wh.id,
        batchNo: "EARLY",
        qty: 5,
        expiryDate: "2026-12-01",
      }),
    );
    const later = await createBatch(
      batchForm({
        itemId: item.id,
        warehouseId: wh.id,
        batchNo: "LATER",
        qty: 5,
        expiryDate: "2027-12-01",
      }),
    );
    const v = await makeVehicle("VIN-BATCH");
    const { id } = await createJobCard({
      vehicleId: v.id,
      warehouseId: wh.id,
      complaint: "",
      technician: "",
      odometer: 0,
      serviceDate: "2026-11-20",
      parts: [{ itemId: item.id, qty: 7, rate: 100 }],
      labor: [],
      photos: [],
      remarks: "",
    });
    await completeJobCard(id);

    let oh = await batchOnHand(item.id, wh.id);
    expect(oh.get(early.id)).toBe(0); // earliest fully consumed
    expect(oh.get(later.id)).toBe(3); // remainder from the next lot
    expect(await binQty(item.id, wh.id)).toBe(3);

    await cancelJobCard(id);
    oh = await batchOnHand(item.id, wh.id);
    expect(oh.get(early.id)).toBe(5); // lots restored to the exact batches
    expect(oh.get(later.id)).toBe(5);
    expect(await binQty(item.id, wh.id)).toBe(10);
  });

  it("blocks deleting a batch that has stock movements", async () => {
    const wh = await makeWarehouse();
    const item = await batchItem();
    const b = await createBatch(
      batchForm({
        itemId: item.id,
        warehouseId: wh.id,
        batchNo: "LOCK",
        qty: 5,
      }),
    );
    await expect(deleteBatch(b.id)).rejects.toThrow(/stock movements/);
  });
});
