import { describe, it, expect, beforeEach } from "vitest";
import {
  createDealer,
  updateDealer,
  deleteDealer,
  listDealers,
  dealerOptions,
} from "@/lib/services/dealers";
import { emptyDealer } from "@/modules/dms/dealers/schema";
import { prisma } from "@/lib/prisma";
import { resetDb } from "./helpers";

const form = (over: Partial<typeof emptyDealer> = {}) => ({
  ...emptyDealer,
  code: "DLR-1",
  name: "Metro EV",
  ...over,
});

describe("dealers service", () => {
  beforeEach(resetDb);

  it("creates a dealer", async () => {
    const d = await createDealer(form());
    expect(d.code).toBe("DLR-1");
    expect(d.vehicleCount).toBe(0);
  });

  it("stores a logo url", async () => {
    const d = await createDealer(form({ logoUrl: "/uploads/logo.png" }));
    expect(d.logoUrl).toBe("/uploads/logo.png");
  });

  it("rejects a duplicate code", async () => {
    await createDealer(form({ code: "DUP" }));
    await expect(createDealer(form({ code: "DUP", name: "Other" }))).rejects.toThrow(
      /already exists/i,
    );
  });

  it("counts assigned vehicles", async () => {
    const d = await createDealer(form());
    await prisma.vehicle.create({
      data: { vin: "V-1", model: "EV", status: "ALLOCATED", dealerId: d.id },
    });
    const { rows } = await listDealers({ page: 1, limit: 20, search: "", sort: "" });
    expect(rows[0].vehicleCount).toBe(1);
  });

  it("blocks delete when vehicles are assigned", async () => {
    const d = await createDealer(form());
    await prisma.vehicle.create({
      data: { vin: "V-2", model: "EV", status: "ALLOCATED", dealerId: d.id },
    });
    await expect(deleteDealer(d.id)).rejects.toThrow(/can't delete/i);
  });

  it("updates and exposes options (active only)", async () => {
    const d = await createDealer(form());
    await updateDealer(d.id, form({ name: "Renamed" }));
    const active = await dealerOptions();
    expect(active.find((o) => o.id === d.id)?.name).toBe("Renamed");
    await updateDealer(d.id, form({ name: "Renamed", disabled: true }));
    expect((await dealerOptions()).find((o) => o.id === d.id)).toBeUndefined();
  });
});
