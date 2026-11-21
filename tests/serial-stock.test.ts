import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { parseSerials } from "@/lib/serial-stock";
import { serialsForItem } from "@/lib/services/serials";
import {
  createStockEntry,
  submitStockEntry,
} from "@/lib/services/stock-entry";
import {
  createJobCard,
  completeJobCard,
  cancelJobCard,
} from "@/lib/services/job-cards";
import { resetDb, seedAccounts, makeWarehouse, makeVehicle } from "./helpers";

function serialItem(code = "SER-1") {
  return prisma.item.create({
    data: {
      itemCode: code,
      itemName: `Serialised ${code}`,
      valuationRate: 500,
      hasSerialNo: true,
    },
  });
}

async function receive(itemId: string, warehouseId: string, serials: string[]) {
  const se = await createStockEntry({
    purpose: "MATERIAL_RECEIPT",
    fromWarehouseId: null,
    toWarehouseId: warehouseId,
    remarks: "",
    items: [
      {
        itemId,
        qty: serials.length,
        basicRate: 500,
        isFinishedItem: false,
        note: "",
        batchNo: "",
        batchExpiry: "",
        serials: serials.join("\n"),
      },
    ],
  });
  await submitStockEntry(se.id);
}

describe("serial-number stock flow", () => {
  beforeEach(resetDb);

  it("parseSerials splits lines/commas and de-dupes", () => {
    expect(parseSerials("A\nB, C;A")).toEqual(["A", "B", "C"]);
    expect(parseSerials("")).toEqual([]);
  });

  it("a receipt registers the serials as in-stock", async () => {
    const wh = await makeWarehouse();
    const item = await serialItem();
    await receive(item.id, wh.id, ["SN-1", "SN-2", "SN-3"]);
    const rows = await serialsForItem(item.id);
    expect(rows.length).toBe(3);
    expect(rows.every((s) => s.status === "IN_STOCK")).toBe(true);
  });

  it("rejects a serial count that doesn't match the qty", async () => {
    const wh = await makeWarehouse();
    const item = await serialItem();
    const se = await createStockEntry({
      purpose: "MATERIAL_RECEIPT",
      fromWarehouseId: null,
      toWarehouseId: wh.id,
      remarks: "",
      items: [
        {
          itemId: item.id,
          qty: 3,
          basicRate: 500,
          isFinishedItem: false,
          note: "",
          batchNo: "",
          batchExpiry: "",
          serials: "SN-1\nSN-2",
        },
      ],
    });
    await expect(submitStockEntry(se.id)).rejects.toThrow(/exactly 3/);
  });

  it("a job card consumes serials (DELIVERED) and cancel restores them", async () => {
    await seedAccounts();
    const wh = await makeWarehouse();
    const item = await serialItem();
    await receive(item.id, wh.id, ["SN-1", "SN-2", "SN-3"]);
    const v = await makeVehicle("VIN-SER");

    const { id } = await createJobCard({
      vehicleId: v.id,
      warehouseId: wh.id,
      complaint: "",
      technician: "",
      odometer: 0,
      serviceDate: "2026-11-21",
      parts: [{ itemId: item.id, qty: 2, rate: 100 }],
      labor: [],
      photos: [],
      remarks: "",
    });
    await completeJobCard(id);

    let rows = await serialsForItem(item.id);
    expect(rows.filter((s) => s.status === "DELIVERED").length).toBe(2);
    expect(rows.filter((s) => s.status === "IN_STOCK").length).toBe(1);

    await cancelJobCard(id);
    rows = await serialsForItem(item.id);
    expect(rows.every((s) => s.status === "IN_STOCK")).toBe(true);
  });
});
