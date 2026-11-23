import { describe, it, expect, beforeEach } from "vitest";
import {
  createRecall,
  getRecall,
  listRecalls,
  recallAnalytics,
  matchAffected,
  addVehicleToRecall,
  setItemStatus,
  removeRecallItem,
  setRecallStatus,
  deleteRecall,
} from "@/lib/services/recalls";
import { prisma } from "@/lib/prisma";
import { resetDb, makeVehicle } from "./helpers";

const form = (over: Partial<Parameters<typeof createRecall>[0]> = {}) => ({
  code: "",
  title: "Battery thermal fault",
  component: "Battery pack",
  severity: "HIGH" as const,
  description: "",
  models: ["Volt City"],
  mfgFrom: null,
  mfgTo: null,
  ...over,
});

const LP = { page: 1, limit: 50, sort: "", search: "" };

describe("recall campaigns service", () => {
  beforeEach(resetDb);

  it("creates a recall with an auto code", async () => {
    const a = await createRecall(form());
    expect(a.code).toMatch(/^RC-\d{4}-0001$/);
    const b = await createRecall(form({ title: "Brake fix" }));
    expect(b.code).toMatch(/^RC-\d{4}-0002$/);
  });

  it("honours a custom OEM code", async () => {
    const r = await createRecall(form({ code: "OEM-RC-9" }));
    expect(r.code).toBe("OEM-RC-9");
  });

  it("matches affected vehicles by model + mfg window", async () => {
    await makeVehicle("V-IN", { model: "Volt City", mfgDate: new Date("2025-03-01") });
    await makeVehicle("V-OUT-MODEL", { model: "Volt Prime", mfgDate: new Date("2025-03-01") });
    await makeVehicle("V-OUT-DATE", { model: "Volt City", mfgDate: new Date("2023-01-01") });

    const r = await createRecall(
      form({ models: ["Volt City"], mfgFrom: "2025-01-01", mfgTo: "2025-12-31" }),
    );
    const { added } = await matchAffected(r.id);
    expect(added).toBe(1);

    const detail = await getRecall(r.id);
    expect(detail?.items.map((i) => i.vin)).toEqual(["V-IN"]);
  });

  it("matches all dates when no mfg window is set", async () => {
    await makeVehicle("V1", { model: "Volt City", mfgDate: new Date("2020-01-01") });
    await makeVehicle("V2", { model: "Volt City", mfgDate: null });
    const r = await createRecall(form({ models: ["Volt City"] }));
    const { added } = await matchAffected(r.id);
    expect(added).toBe(2);
  });

  it("match is idempotent (no duplicates)", async () => {
    await makeVehicle("V1", { model: "Volt City" });
    const r = await createRecall(form({ models: ["Volt City"] }));
    await matchAffected(r.id);
    const second = await matchAffected(r.id);
    expect(second.added).toBe(0);
    expect((await getRecall(r.id))?.items.length).toBe(1);
  });

  it("refuses to match with no models", async () => {
    const r = await createRecall(form({ models: [] }));
    await expect(matchAffected(r.id)).rejects.toThrow(/model/i);
  });

  it("tracks remediation through item statuses + completion", async () => {
    await makeVehicle("V1", { model: "Volt City" });
    await makeVehicle("V2", { model: "Volt City" });
    const r = await createRecall(form({ models: ["Volt City"] }));
    await matchAffected(r.id);

    let d = await getRecall(r.id);
    const items = d!.items;
    expect(items.length).toBe(2);
    expect(d!.summary.completionPct).toBe(0);

    await setItemStatus(items[0].id, "NOTIFIED");
    await setItemStatus(items[1].id, "REPAIRED");
    d = await getRecall(r.id);
    expect(d!.summary.notified).toBe(1);
    expect(d!.summary.repaired).toBe(1);
    expect(d!.summary.completionPct).toBe(50);
    const repaired = d!.items.find((i) => i.status === "REPAIRED");
    expect(repaired?.repairedAt).toBeTruthy();
  });

  it("manually adds a vehicle and blocks duplicates", async () => {
    const v = await makeVehicle("V1", { model: "Zip" });
    const r = await createRecall(form({ models: ["Volt City"] }));
    await addVehicleToRecall(r.id, v.id);
    expect((await getRecall(r.id))?.items.length).toBe(1);
    await expect(addVehicleToRecall(r.id, v.id)).rejects.toThrow(/already/i);
  });

  it("removes an item", async () => {
    await makeVehicle("V1", { model: "Volt City" });
    const r = await createRecall(form({ models: ["Volt City"] }));
    await matchAffected(r.id);
    const item = (await getRecall(r.id))!.items[0];
    await removeRecallItem(item.id);
    expect((await getRecall(r.id))?.items.length).toBe(0);
  });

  it("closes and reopens, and deleting cascades items", async () => {
    await makeVehicle("V1", { model: "Volt City" });
    const r = await createRecall(form({ models: ["Volt City"] }));
    await matchAffected(r.id);
    await setRecallStatus(r.id, "CLOSED");
    expect((await getRecall(r.id))?.status).toBe("CLOSED");
    expect((await getRecall(r.id))?.closedAt).toBeTruthy();
    await setRecallStatus(r.id, "OPEN");
    expect((await getRecall(r.id))?.closedAt).toBeNull();

    await deleteRecall(r.id);
    expect(await getRecall(r.id)).toBeNull();
    expect(await prisma.recallItem.count()).toBe(0);
  });

  it("list + analytics summarise affected and repaired", async () => {
    await makeVehicle("V1", { model: "Volt City" });
    await makeVehicle("V2", { model: "Volt City" });
    const r = await createRecall(form({ models: ["Volt City"], severity: "CRITICAL" }));
    await matchAffected(r.id);
    const items = (await getRecall(r.id))!.items;
    await setItemStatus(items[0].id, "REPAIRED");

    const { rows } = await listRecalls(LP, {});
    const row = rows.find((x) => x.id === r.id)!;
    expect(row.affected).toBe(2);
    expect(row.repaired).toBe(1);

    const a = await recallAnalytics();
    expect(a.openCampaigns).toBe(1);
    expect(a.affectedVehicles).toBe(2);
    expect(a.repaired).toBe(1);
    expect(a.completionPct).toBe(50);
    expect(a.bySeverity.find((s) => s.name === "Critical")?.value).toBe(1);
  });
});
