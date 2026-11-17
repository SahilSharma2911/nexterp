import { describe, it, expect, beforeEach } from "vitest";
import {
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleById,
  listVehicles,
  vehicleOptions,
  getVehicleRelated,
} from "@/lib/services/vehicles";
import { emptyVehicle } from "@/modules/dms/vehicles/schema";
import { prisma } from "@/lib/prisma";
import { resetDb, makeWarehouse } from "./helpers";

const list = (filters = {}) =>
  listVehicles({ page: 1, limit: 20, search: "", sort: "" }, filters);

const form = (over: Partial<typeof emptyVehicle> = {}) => ({
  ...emptyVehicle,
  vin: "VIN-A",
  model: "City EV",
  ...over,
});

describe("vehicles service", () => {
  beforeEach(resetDb);

  it("creates a vehicle and resolves the core warehouse name", async () => {
    const wh = await makeWarehouse("Depot");
    const v = await createVehicle(form({ vin: "VIN-1", warehouseId: wh.id, batterySoH: 95 }));
    expect(v.vin).toBe("VIN-1");
    expect(v.warehouse).toBe("Depot");
    expect(v.batterySoH).toBe(95);
  });

  it("rejects a duplicate VIN", async () => {
    await createVehicle(form({ vin: "DUP" }));
    await expect(createVehicle(form({ vin: "DUP" }))).rejects.toThrow(/already exists/i);
  });

  it("updates a vehicle", async () => {
    const v = await createVehicle(form({ vin: "VIN-U" }));
    const u = await updateVehicle(v.id, form({ vin: "VIN-U", status: "DELIVERED" }));
    expect(u.status).toBe("DELIVERED");
  });

  it("filters the list by status and search", async () => {
    await createVehicle(form({ vin: "AAA", status: "IN_STOCK" }));
    await createVehicle(form({ vin: "BBB", status: "DELIVERED" }));
    expect((await list({ status: "DELIVERED" })).total).toBe(1);
    expect((await list({ status: "all" })).total).toBe(2);
    const searched = await listVehicles(
      { page: 1, limit: 20, search: "AAA", sort: "" },
      {},
    );
    expect(searched.total).toBe(1);
  });

  it("blocks delete when the vehicle has a warranty", async () => {
    const v = await createVehicle(form({ vin: "VIN-W" }));
    await prisma.warranty.create({
      data: { vehicleId: v.id, component: "BATTERY", startDate: new Date(), months: 36 },
    });
    await expect(deleteVehicle(v.id)).rejects.toThrow(/can't delete/i);
  });

  it("deletes a vehicle with no references", async () => {
    const v = await createVehicle(form({ vin: "VIN-D" }));
    await deleteVehicle(v.id);
    expect(await getVehicleById(v.id)).toBeNull();
  });

  it("exposes options", async () => {
    await createVehicle(form({ vin: "OPT-1" }));
    const opts = await vehicleOptions();
    expect(opts.map((o) => o.vin)).toContain("OPT-1");
  });

  it("aggregates related DMS history (service, warranty, subsidy)", async () => {
    const v = await createVehicle(form({ vin: "VIN-H" }));
    await prisma.jobCard.create({
      data: { name: "JOB-H", vehicleId: v.id, status: "OPEN", total: 500 },
    });
    await prisma.warranty.create({
      data: {
        vehicleId: v.id,
        component: "BATTERY",
        startDate: new Date("2026-01-01"),
        months: 12,
      },
    });
    const scheme = await prisma.subsidyScheme.create({
      data: { code: "S1", name: "S1", amount: 1000 },
    });
    await prisma.subsidyClaim.create({
      data: {
        name: "SUB-H",
        schemeId: scheme.id,
        vehicleId: v.id,
        customerName: "A",
        claimAmount: 1000,
      },
    });

    const r = await getVehicleRelated(v.id);
    expect(r.jobCards).toHaveLength(1);
    expect(r.warranties[0].component).toMatch(/battery/i);
    expect(r.subsidyClaims[0].scheme).toBe("S1");
  });
});
