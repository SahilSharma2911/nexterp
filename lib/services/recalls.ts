import { Prisma, type RecallItemStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import {
  SEVERITY_LABELS,
  RECALL_SEVERITIES,
  type RecallAnalytics,
  type RecallDetail,
  type RecallFormValues,
  type RecallItemRow,
  type RecallListItem,
} from "@/modules/dms/recalls/schema";

const SORTABLE = ["code", "title", "severity", "status", "launchedAt"] as const;

function toData(v: RecallFormValues) {
  return {
    title: v.title.trim(),
    component: v.component?.trim() || null,
    severity: v.severity,
    description: v.description?.trim() || null,
    models: (v.models ?? []).map((m) => m.trim()).filter(Boolean),
    mfgFrom: v.mfgFrom ? new Date(v.mfgFrom) : null,
    mfgTo: v.mfgTo ? new Date(v.mfgTo) : null,
  };
}

export async function listRecalls(
  p: ListParams,
  filters: { status?: string; severity?: string },
): Promise<ListResponse<RecallListItem>> {
  const where: Prisma.RecallCampaignWhereInput = {};
  if (filters.status && filters.status !== "all")
    where.status = filters.status as RecallListItem["status"];
  if (filters.severity && filters.severity !== "all")
    where.severity = filters.severity as RecallListItem["severity"];
  if (p.search)
    where.OR = [
      { code: { contains: p.search, mode: "insensitive" } },
      { title: { contains: p.search, mode: "insensitive" } },
      { component: { contains: p.search, mode: "insensitive" } },
    ];
  const orderBy = parseSort(p.sort, SORTABLE, { launchedAt: "desc" });

  const [rows, total, agg] = await Promise.all([
    prisma.recallCampaign.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
    }),
    prisma.recallCampaign.count({ where }),
    prisma.recallItem.groupBy({ by: ["campaignId", "status"], _count: true }),
  ]);

  const affectedBy = new Map<string, number>();
  const repairedBy = new Map<string, number>();
  for (const g of agg) {
    affectedBy.set(g.campaignId, (affectedBy.get(g.campaignId) ?? 0) + g._count);
    if (g.status === "REPAIRED")
      repairedBy.set(g.campaignId, g._count);
  }

  return {
    rows: rows.map((r) => ({
      id: r.id,
      code: r.code,
      title: r.title,
      component: r.component,
      severity: r.severity,
      status: r.status,
      models: r.models,
      launchedAt: r.launchedAt.toISOString(),
      affected: affectedBy.get(r.id) ?? 0,
      repaired: repairedBy.get(r.id) ?? 0,
    })),
    total,
    page: p.page,
    limit: p.limit,
  };
}

export async function recallAnalytics(): Promise<RecallAnalytics> {
  const [open, agg, bySeverity] = await Promise.all([
    prisma.recallCampaign.count({ where: { status: "OPEN" } }),
    prisma.recallItem.groupBy({ by: ["status"], _count: true }),
    prisma.recallCampaign.groupBy({
      by: ["severity"],
      where: { status: "OPEN" },
      _count: true,
    }),
  ]);
  const countFor = (s: string) =>
    agg.find((g) => g.status === s)?._count ?? 0;
  const affected = agg.reduce((n, g) => n + g._count, 0);
  const repaired = countFor("REPAIRED");
  return {
    openCampaigns: open,
    affectedVehicles: affected,
    pending: countFor("PENDING"),
    repaired,
    completionPct: affected ? Math.round((repaired / affected) * 100) : 0,
    bySeverity: RECALL_SEVERITIES.map((s) => ({
      name: SEVERITY_LABELS[s],
      value: bySeverity.find((g) => g.severity === s)?._count ?? 0,
    })),
  };
}

function toItemRow(
  r: Prisma.RecallItemGetPayload<{
    include: { vehicle: { select: { vin: true; model: true; customerName: true } } };
  }>,
  jobName: string | null,
): RecallItemRow {
  return {
    id: r.id,
    vehicleId: r.vehicleId,
    vin: r.vehicle.vin,
    model: r.vehicle.model,
    customerName: r.vehicle.customerName,
    status: r.status,
    jobCardId: r.jobCardId,
    jobCard: jobName,
    notifiedAt: r.notifiedAt ? r.notifiedAt.toISOString() : null,
    repairedAt: r.repairedAt ? r.repairedAt.toISOString() : null,
    notes: r.notes,
  };
}

export async function getRecall(id: string): Promise<RecallDetail | null> {
  const r = await prisma.recallCampaign.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          vehicle: { select: { vin: true, model: true, customerName: true } },
        },
      },
    },
  });
  if (!r) return null;

  const jobIds = r.items.map((i) => i.jobCardId).filter(Boolean) as string[];
  const jobs = jobIds.length
    ? await prisma.jobCard.findMany({
        where: { id: { in: jobIds } },
        select: { id: true, name: true },
      })
    : [];
  const jobMap = new Map(jobs.map((j) => [j.id, j.name]));

  const items = r.items.map((i) =>
    toItemRow(i, i.jobCardId ? (jobMap.get(i.jobCardId) ?? null) : null),
  );
  const count = (s: RecallItemStatus) =>
    items.filter((i) => i.status === s).length;
  const affected = items.length;
  const repaired = count("REPAIRED");

  return {
    id: r.id,
    code: r.code,
    title: r.title,
    component: r.component,
    severity: r.severity,
    status: r.status,
    description: r.description,
    models: r.models,
    mfgFrom: r.mfgFrom ? r.mfgFrom.toISOString() : null,
    mfgTo: r.mfgTo ? r.mfgTo.toISOString() : null,
    launchedAt: r.launchedAt.toISOString(),
    closedAt: r.closedAt ? r.closedAt.toISOString() : null,
    items,
    summary: {
      affected,
      pending: count("PENDING"),
      notified: count("NOTIFIED"),
      repaired,
      notAffected: count("NOT_AFFECTED"),
      completionPct: affected ? Math.round((repaired / affected) * 100) : 0,
    },
  };
}

export async function createRecall(
  values: RecallFormValues,
): Promise<{ id: string; code: string }> {
  const year = new Date().getFullYear();
  const count = await prisma.recallCampaign.count();
  const code = values.code?.trim() || `RC-${year}-${String(count + 1).padStart(4, "0")}`;
  const r = await prisma.recallCampaign.create({
    data: { code, ...toData(values) },
  });
  return { id: r.id, code: r.code };
}

export async function updateRecall(
  id: string,
  values: RecallFormValues,
): Promise<{ id: string }> {
  const existing = await prisma.recallCampaign.findUnique({ where: { id } });
  if (!existing) throw new Error("Recall not found");
  const data = toData(values);
  await prisma.recallCampaign.update({
    where: { id },
    data: values.code?.trim() ? { code: values.code.trim(), ...data } : data,
  });
  return { id };
}

export async function deleteRecall(id: string): Promise<void> {
  await prisma.recallCampaign.delete({ where: { id } }); // cascades items
}

// Auto-match vehicles affected by a recall: model in scope + (if set) built
// inside the manufacturing window. Adds any not already on the campaign.
export async function matchAffected(id: string): Promise<{ added: number }> {
  const c = await prisma.recallCampaign.findUnique({ where: { id } });
  if (!c) throw new Error("Recall not found");
  if (c.models.length === 0)
    throw new Error("Add at least one affected model before matching.");

  const where: Prisma.VehicleWhereInput = { model: { in: c.models } };
  if (c.mfgFrom || c.mfgTo) {
    where.mfgDate = {};
    if (c.mfgFrom) where.mfgDate.gte = c.mfgFrom;
    if (c.mfgTo) where.mfgDate.lte = c.mfgTo;
  }

  const vehicles = await prisma.vehicle.findMany({
    where,
    select: { id: true },
  });
  if (vehicles.length === 0) return { added: 0 };

  const res = await prisma.recallItem.createMany({
    data: vehicles.map((v) => ({ campaignId: id, vehicleId: v.id })),
    skipDuplicates: true,
  });
  return { added: res.count };
}

export async function addVehicleToRecall(
  id: string,
  vehicleId: string,
): Promise<void> {
  const v = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!v) throw new Error("Vehicle not found");
  const dup = await prisma.recallItem.findUnique({
    where: { campaignId_vehicleId: { campaignId: id, vehicleId } },
  });
  if (dup) throw new Error("That vehicle is already on this recall.");
  await prisma.recallItem.create({ data: { campaignId: id, vehicleId } });
}

export async function setItemStatus(
  itemId: string,
  status: RecallItemStatus,
  opts?: { jobCardId?: string | null; notes?: string | null },
): Promise<void> {
  const item = await prisma.recallItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error("Recall item not found");
  await prisma.recallItem.update({
    where: { id: itemId },
    data: {
      status,
      notifiedAt:
        status === "NOTIFIED" && !item.notifiedAt ? new Date() : item.notifiedAt,
      repairedAt: status === "REPAIRED" ? new Date() : null,
      jobCardId:
        opts?.jobCardId !== undefined ? opts.jobCardId : item.jobCardId,
      notes: opts?.notes !== undefined ? opts.notes : item.notes,
    },
  });
}

export async function removeRecallItem(itemId: string): Promise<void> {
  await prisma.recallItem.delete({ where: { id: itemId } });
}

export async function setRecallStatus(
  id: string,
  status: "OPEN" | "CLOSED",
): Promise<void> {
  await prisma.recallCampaign.update({
    where: { id },
    data: { status, closedAt: status === "CLOSED" ? new Date() : null },
  });
}
