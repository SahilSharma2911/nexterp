import { describe, it, expect, beforeEach } from "vitest";
import {
  createAllocationRequest,
  previewAllocation,
  commitAllocation,
  updateAllocationRule,
} from "@/lib/services/allocation";
import { prisma } from "@/lib/prisma";
import { resetDb } from "./helpers";

function mkVeh(
  vin: string,
  model: string,
  variant: string | null,
  daysAgo: number,
) {
  return prisma.vehicle.create({
    data: {
      vin,
      model,
      variant,
      status: "IN_STOCK",
      createdAt: new Date(Date.now() - daysAgo * 86_400_000),
    },
  });
}

describe("FIFO allocation engine", () => {
  beforeEach(resetDb);

  it("allocates oldest matching stock to demand, then advances the request", async () => {
    const dealer = await prisma.dealer.create({ data: { code: "D1", name: "D1" } });
    const old = await mkVeh("V-OLD", "Volt City", null, 30);
    await mkVeh("V-MID", "Volt City", null, 10);
    const young = await mkVeh("V-NEW", "Volt City", null, 1);
    const other = await mkVeh("V-OTH", "Volt Prime", null, 20);

    const req = await createAllocationRequest({
      dealerId: dealer.id,
      model: "Volt City",
      qty: 2,
      priority: 2,
    });

    // Preview: oldest two Volt City, in FIFO order.
    const plan = await previewAllocation();
    expect(plan.lines).toHaveLength(1);
    expect(plan.lines[0].vehicles.map((v) => v.vin)).toEqual(["V-OLD", "V-MID"]);
    expect(plan.totalVehicles).toBe(2);

    // Commit.
    const res = await commitAllocation("tester");
    expect(res.allocated).toBe(2);

    const oldV = await prisma.vehicle.findUnique({ where: { id: old.id } });
    expect(oldV?.status).toBe("ALLOCATED");
    expect(oldV?.dealerId).toBe(dealer.id);

    const r2 = await prisma.allocationRequest.findUnique({ where: { id: req.id } });
    expect(r2?.qtyAllocated).toBe(2);
    expect(r2?.status).toBe("FULFILLED");

    // Younger + non-matching stay in stock.
    expect(
      (await prisma.vehicle.findUnique({ where: { id: young.id } }))?.status,
    ).toBe("IN_STOCK");
    expect(
      (await prisma.vehicle.findUnique({ where: { id: other.id } }))?.status,
    ).toBe("IN_STOCK");
  });

  it("reports a shortfall and respects match-model", async () => {
    const dealer = await prisma.dealer.create({ data: { code: "D2", name: "D2" } });
    await mkVeh("P1", "Volt Prime", null, 5); // wrong model
    await createAllocationRequest({
      dealerId: dealer.id,
      model: "Volt City",
      qty: 2,
      priority: 2,
    });
    const plan = await previewAllocation();
    expect(plan.lines).toHaveLength(0);
    expect(plan.unmatched[0].short).toBe(2);
  });

  it("oldest-first rule off reverses the pick order", async () => {
    const dealer = await prisma.dealer.create({ data: { code: "D3", name: "D3" } });
    await mkVeh("A", "Volt City", null, 30);
    await mkVeh("B", "Volt City", null, 1);
    await updateAllocationRule({
      oldestFirst: false,
      matchModel: true,
      matchVariant: false,
      maxAgeDays: null,
    });
    await createAllocationRequest({
      dealerId: dealer.id,
      model: "Volt City",
      qty: 1,
      priority: 2,
    });
    const plan = await previewAllocation();
    expect(plan.lines[0].vehicles[0].vin).toBe("B"); // newest first
  });
});
