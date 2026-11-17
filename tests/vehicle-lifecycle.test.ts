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
import { resetDb, makeVehicle } from "./helpers";

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
