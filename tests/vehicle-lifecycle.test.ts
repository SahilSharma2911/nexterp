import { describe, it, expect, beforeEach } from "vitest";
import {
  allocateVehicle,
  dispatchVehicle,
  receiveVehicleAtDealer,
  recordPdi,
  deliverVehicle,
  getVehicleLifecycle,
} from "@/lib/services/vehicle-lifecycle";
import { prisma } from "@/lib/prisma";
import {
  resetDb,
  makeVehicle,
  makeWarehouse,
  makeItem,
  stockIn,
  binQty,
  seedAccounts,
  glFor,
} from "./helpers";

async function setup() {
  const dealer = await prisma.dealer.create({
    data: { code: "D1", name: "Metro EV" },
  });
  const vehicle = await makeVehicle("VIN-LC"); // defaults to IN_STOCK
  return { dealerId: dealer.id, vehicleId: vehicle.id };
}

const pdiItems = (allOk = true) => [
  { label: "Brakes", ok: true, note: "" },
  { label: "Battery", ok: allOk, note: "" },
];

async function stageOf(id: string) {
  return (await getVehicleLifecycle(id))?.stage;
}

describe("vehicle lifecycle", () => {
  beforeEach(resetDb);

  it("runs the full happy path and logs a timeline", async () => {
    const { dealerId, vehicleId } = await setup();
    await allocateVehicle(vehicleId, { dealerId }, "Alice");
    expect(await stageOf(vehicleId)).toBe("ALLOCATED");
    await dispatchVehicle(vehicleId, undefined, "Alice");
    expect(await stageOf(vehicleId)).toBe("IN_TRANSIT");
    await receiveVehicleAtDealer(vehicleId, undefined, "Bob");
    expect(await stageOf(vehicleId)).toBe("AT_DEALER");
    const pdi = await recordPdi(vehicleId, { items: pdiItems(true) }, "Bob");
    expect(pdi.result).toBe("PASS");
    expect(await stageOf(vehicleId)).toBe("PDI_DONE");
    await deliverVehicle(vehicleId, { customerName: "Anita K" }, "Bob");

    const v = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    expect(v?.status).toBe("DELIVERED");
    expect(v?.customerName).toBe("Anita K");
    expect(v?.deliveredAt).not.toBeNull();

    const lc = await getVehicleLifecycle(vehicleId);
    expect(lc?.timeline.map((e) => e.stage)).toEqual([
      "DELIVERED",
      "PDI_DONE",
      "AT_DEALER",
      "IN_TRANSIT",
      "ALLOCATED",
    ]); // newest first
    expect(lc?.timeline.at(-1)?.byUser).toBe("Alice");
  });

  it("sets the dealer when allocated", async () => {
    const { dealerId, vehicleId } = await setup();
    await allocateVehicle(vehicleId, { dealerId });
    const v = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    expect(v?.dealerId).toBe(dealerId);
  });

  it("enforces stage order", async () => {
    const { dealerId, vehicleId } = await setup();
    await expect(dispatchVehicle(vehicleId, undefined)).rejects.toThrow(/stage/i);
    await allocateVehicle(vehicleId, { dealerId });
    await expect(allocateVehicle(vehicleId, { dealerId })).rejects.toThrow(/stage/i);
    await expect(
      deliverVehicle(vehicleId, { customerName: "X" }),
    ).rejects.toThrow(/stage/i);
  });

  it("posts Debtors / Vehicle Sales to the GL on delivery", async () => {
    await seedAccounts();
    const dealer = await prisma.dealer.create({ data: { code: "D2", name: "D2" } });
    const v = await makeVehicle("VIN-SALE", { sellingRate: 999000 });
    await allocateVehicle(v.id, { dealerId: dealer.id });
    await dispatchVehicle(v.id, undefined);
    await receiveVehicleAtDealer(v.id, undefined);
    await recordPdi(v.id, { items: pdiItems(true) });
    await deliverVehicle(v.id, { customerName: "Anita K" });

    const gl = await glFor("VIN-SALE"); // voucherNo = VIN
    const debtors = gl.find((g) => g.account.accountName === "Debtors");
    const sales = gl.find((g) => g.account.accountName === "Vehicle Sales");
    expect(Number(debtors?.debit)).toBe(999000);
    expect(Number(sales?.credit)).toBe(999000);
  });

  it("sells accessories at delivery: issues stock + posts Accessory Sales", async () => {
    await seedAccounts();
    const dealer = await prisma.dealer.create({ data: { code: "DA", name: "DA" } });
    const wh = await makeWarehouse();
    const helmet = await makeItem("HELMET", 1500);
    await stockIn(helmet.id, wh.id, 10, 1500);
    const v = await makeVehicle("VIN-ACC", {
      sellingRate: 800000,
      warehouseId: wh.id,
    });
    await allocateVehicle(v.id, { dealerId: dealer.id });
    await dispatchVehicle(v.id, undefined);
    await receiveVehicleAtDealer(v.id, undefined);
    await recordPdi(v.id, { items: pdiItems(true) });
    await deliverVehicle(v.id, {
      customerName: "Anita K",
      accessories: [{ itemId: helmet.id, qty: 2, rate: 2000 }],
    });

    // accessory issued from stock
    expect(await binQty(helmet.id, wh.id)).toBe(8); // 10 - 2
    // recorded on the vehicle
    const lc = await getVehicleLifecycle(v.id);
    expect(lc?.accessories[0].amount).toBe(4000);
    // GL: vehicle 800000 + accessories 4000
    const gl = await glFor("VIN-ACC");
    expect(Number(gl.find((g) => g.account.accountName === "Debtors")?.debit)).toBe(804000);
    expect(Number(gl.find((g) => g.account.accountName === "Vehicle Sales")?.credit)).toBe(800000);
    expect(Number(gl.find((g) => g.account.accountName === "Accessory Sales")?.credit)).toBe(4000);
  });

  it("skips the GL posting when the vehicle has no selling price", async () => {
    await seedAccounts();
    const dealer = await prisma.dealer.create({ data: { code: "D3", name: "D3" } });
    const v = await makeVehicle("VIN-FREE"); // sellingRate 0
    await allocateVehicle(v.id, { dealerId: dealer.id });
    await dispatchVehicle(v.id, undefined);
    await receiveVehicleAtDealer(v.id, undefined);
    await recordPdi(v.id, { items: pdiItems(true) });
    await deliverVehicle(v.id, { customerName: "No Charge" });
    expect(await glFor("VIN-FREE")).toHaveLength(0);
  });

  it("a failed PDI records the inspection but does not advance", async () => {
    const { dealerId, vehicleId } = await setup();
    await allocateVehicle(vehicleId, { dealerId });
    await dispatchVehicle(vehicleId, undefined);
    await receiveVehicleAtDealer(vehicleId, undefined);
    const res = await recordPdi(vehicleId, { items: pdiItems(false) });
    expect(res.result).toBe("FAIL");
    expect(await stageOf(vehicleId)).toBe("AT_DEALER"); // unchanged
    const lc = await getVehicleLifecycle(vehicleId);
    expect(lc?.inspections[0].result).toBe("FAIL");
  });
});
