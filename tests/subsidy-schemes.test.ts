import { describe, it, expect, beforeEach } from "vitest";
import {
  createScheme,
  deleteScheme,
  schemeOptions,
  listSchemes,
} from "@/lib/services/subsidy-schemes";
import { emptyScheme } from "@/modules/dms/subsidy-schemes/schema";
import { prisma } from "@/lib/prisma";
import { resetDb, makeVehicle } from "./helpers";

const form = (over: Partial<typeof emptyScheme> = {}) => ({
  ...emptyScheme,
  code: "FAME-II",
  name: "FAME-II Subsidy",
  amount: 150000,
  ...over,
});

describe("subsidy schemes service", () => {
  beforeEach(resetDb);

  it("creates a scheme and exposes its amount via options", async () => {
    const s = await createScheme(form());
    const opt = (await schemeOptions()).find((o) => o.id === s.id);
    expect(opt?.amount).toBe(150000);
  });

  it("rejects a duplicate code", async () => {
    await createScheme(form({ code: "DUP" }));
    await expect(createScheme(form({ code: "DUP", name: "x" }))).rejects.toThrow(
      /already exists/i,
    );
  });

  it("closed schemes drop out of options", async () => {
    const s = await createScheme(form());
    await prisma.subsidyScheme.update({ where: { id: s.id }, data: { status: "CLOSED" } });
    expect((await schemeOptions()).some((o) => o.id === s.id)).toBe(false);
  });

  it("blocks delete when a claim exists and counts claims", async () => {
    const s = await createScheme(form());
    const v = await makeVehicle("VIN-SS");
    await prisma.subsidyClaim.create({
      data: { name: "SUB-X", schemeId: s.id, vehicleId: v.id, customerName: "A", claimAmount: 1 },
    });
    const { rows } = await listSchemes({ page: 1, limit: 20, search: "", sort: "" }, {});
    expect(rows[0].claimCount).toBe(1);
    await expect(deleteScheme(s.id)).rejects.toThrow(/can't delete/i);
  });
});
