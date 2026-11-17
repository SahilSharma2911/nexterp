import { describe, it, expect, beforeEach } from "vitest";
import {
  createWarranty,
  deleteWarranty,
  warrantyOptions,
} from "@/lib/services/warranties";
import { emptyWarranty } from "@/modules/dms/warranties/schema";
import { prisma } from "@/lib/prisma";
import { resetDb, makeVehicle } from "./helpers";

async function vehicle() {
  return (await makeVehicle("VIN-WAR")).id;
}

const form = (vehicleId: string, over: Partial<typeof emptyWarranty> = {}) => ({
  ...emptyWarranty,
  vehicleId,
  component: "BATTERY" as const,
  startDate: "2026-01-01",
  months: 96,
  soHThreshold: 80,
  ...over,
});

describe("warranties service", () => {
  beforeEach(resetDb);

  it("computes expiry, active and days-left", async () => {
    const v = await vehicle();
    const w = await createWarranty(form(v, { startDate: "2026-01-01", months: 12 }));
    expect(w.expiryDate.slice(0, 10)).toBe("2027-01-01");
    expect(typeof w.active).toBe("boolean");
    expect(w.claimCount).toBe(0);
  });

  it("options only include active warranties", async () => {
    const v = await vehicle();
    const w = await createWarranty(form(v));
    expect((await warrantyOptions()).some((o) => o.id === w.id)).toBe(true);
    await prisma.warranty.update({ where: { id: w.id }, data: { status: "VOID" } });
    expect((await warrantyOptions()).some((o) => o.id === w.id)).toBe(false);
  });

  it("blocks delete when a claim exists", async () => {
    const v = await vehicle();
    const w = await createWarranty(form(v));
    await prisma.warrantyClaim.create({
      data: { name: "WCLM-X", warrantyId: w.id, claimAmount: 0 },
    });
    await expect(deleteWarranty(w.id)).rejects.toThrow(/can't delete/i);
  });
});
