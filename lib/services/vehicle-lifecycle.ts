import type { Prisma, VehicleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { postGL, getAccountId } from "@/lib/gl";
import { postStockLedger } from "@/lib/stock-ledger";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
import type {
  AllocateValues,
  DeliverValues,
  PdiValues,
  VehicleLifecycle,
  VehicleScanResult,
} from "@/modules/dms/vehicles/lifecycle-schema";

// Resolve a scanned VIN (or barcode) to a vehicle summary for the scan station.
export async function vehicleByVin(
  code: string,
): Promise<VehicleScanResult | null> {
  const c = code.trim();
  if (!c) return null;
  const v = await prisma.vehicle.findFirst({
    where: { vin: { equals: c, mode: "insensitive" } },
    select: {
      id: true,
      vin: true,
      model: true,
      variant: true,
      status: true,
      imageUrl: true,
      dealer: { select: { name: true } },
    },
  });
  if (!v) return null;
  return {
    id: v.id,
    vin: v.vin,
    model: v.model,
    variant: v.variant,
    status: v.status,
    dealerName: v.dealer?.name ?? null,
    imageUrl: v.imageUrl,
  };
}

async function requireStage(id: string, stage: VehicleStatus, action: string) {
  const v = await prisma.vehicle.findUnique({
    where: { id },
    select: { id: true, status: true, warehouseId: true, dealerId: true },
  });
  if (!v) throw new Error("Vehicle not found");
  if (v.status !== stage)
    throw new Error(
      `Can't ${action} — vehicle must be at the "${stage}" stage (it's "${v.status}").`,
    );
  return v;
}

function logEvent(
  tx: Prisma.TransactionClient,
  p: {
    vehicleId: string;
    stage: VehicleStatus;
    note?: string;
    dealerId?: string | null;
    warehouseId?: string | null;
    by?: string | null;
  },
) {
  return tx.vehicleEvent.create({
    data: {
      vehicleId: p.vehicleId,
      stage: p.stage,
      note: p.note?.trim() || null,
      dealerId: p.dealerId ?? null,
      warehouseId: p.warehouseId ?? null,
      byUser: p.by ?? null,
    },
  });
}

export async function allocateVehicle(
  id: string,
  values: AllocateValues,
  by?: string | null,
) {
  await requireStage(id, "IN_STOCK", "allocate");
  await prisma.$transaction(async (tx) => {
    await tx.vehicle.update({
      where: { id },
      data: { status: "ALLOCATED", dealerId: values.dealerId },
    });
    await logEvent(tx, {
      vehicleId: id,
      stage: "ALLOCATED",
      note: values.note,
      dealerId: values.dealerId,
      by,
    });
  });
}

export async function dispatchVehicle(
  id: string,
  note: string | undefined,
  by?: string | null,
) {
  const v = await requireStage(id, "ALLOCATED", "dispatch");
  await prisma.$transaction(async (tx) => {
    await tx.vehicle.update({ where: { id }, data: { status: "IN_TRANSIT" } });
    await logEvent(tx, {
      vehicleId: id,
      stage: "IN_TRANSIT",
      note,
      dealerId: v.dealerId,
      by,
    });
  });
}

export async function receiveVehicleAtDealer(
  id: string,
  note: string | undefined,
  by?: string | null,
) {
  const v = await requireStage(id, "IN_TRANSIT", "receive");
  await prisma.$transaction(async (tx) => {
    await tx.vehicle.update({ where: { id }, data: { status: "AT_DEALER" } });
    await logEvent(tx, {
      vehicleId: id,
      stage: "AT_DEALER",
      note,
      dealerId: v.dealerId,
      by,
    });
  });
}

// Records the PDI; only a full pass advances the vehicle to PDI_DONE.
export async function recordPdi(
  id: string,
  values: PdiValues,
  by?: string | null,
): Promise<{ result: "PASS" | "FAIL" }> {
  const v = await requireStage(id, "AT_DEALER", "run PDI");
  const passed = values.items.every((i) => i.ok);
  await prisma.$transaction(async (tx) => {
    await tx.vehicleInspection.create({
      data: {
        vehicleId: id,
        inspector: values.inspector?.trim() || by || null,
        result: passed ? "PASS" : "FAIL",
        note: values.note?.trim() || null,
        items: {
          create: values.items.map((i) => ({
            label: i.label,
            ok: i.ok,
            note: i.note?.trim() || null,
          })),
        },
      },
    });
    if (passed) {
      await tx.vehicle.update({ where: { id }, data: { status: "PDI_DONE" } });
      await logEvent(tx, {
        vehicleId: id,
        stage: "PDI_DONE",
        note: "PDI passed",
        dealerId: v.dealerId,
        by,
      });
    } else {
      await logEvent(tx, {
        vehicleId: id,
        stage: "AT_DEALER",
        note: "PDI failed — re-inspection required",
        dealerId: v.dealerId,
        by,
      });
    }
  });
  return { result: passed ? "PASS" : "FAIL" };
}

// Revenue accounts for a sale: prefer the dedicated one, fall back to "Sales".
async function incomeAccountId(
  tx: Prisma.TransactionClient,
  preferred: string,
): Promise<string> {
  const a =
    (await tx.account.findFirst({ where: { accountName: preferred } })) ??
    (await tx.account.findFirst({ where: { accountName: "Sales" } }));
  if (!a)
    throw new Error(
      `No "${preferred}" or "Sales" account — seed the chart of accounts first`,
    );
  return a.id;
}

export async function deliverVehicle(
  id: string,
  values: DeliverValues,
  by?: string | null,
) {
  const v = await requireStage(id, "PDI_DONE", "deliver");
  const customer = values.customerName.trim();
  const accessories = (values.accessories ?? []).map((a) => ({
    itemId: a.itemId,
    qty: a.qty,
    rate: a.rate,
    amount: round2(a.qty * a.rate),
  }));
  const accTotal = round2(accessories.reduce((s, a) => s + a.amount, 0));

  await prisma.$transaction(async (tx) => {
    const veh = await tx.vehicle.findUnique({
      where: { id },
      select: { vin: true, sellingRate: true },
    });
    const price = Number(veh?.sellingRate ?? 0);

    // Pre-fit accessories (added before delivery) are replaced by the final
    // delivered list — stock + GL happen once here, at the sale.
    await tx.vehicleAccessory.deleteMany({ where: { vehicleId: id } });

    await tx.vehicle.update({
      where: { id },
      data: {
        status: "DELIVERED",
        customerId: values.customerId || null,
        customerName: customer,
        deliveredAt: new Date(),
        accessories: { create: accessories },
      },
    });

    // Issue the accessories from the vehicle's warehouse (core stock ledger).
    if (accessories.length && v.warehouseId) {
      for (const a of accessories) {
        await postStockLedger(tx, {
          itemId: a.itemId,
          warehouseId: v.warehouseId,
          actualQty: -a.qty,
          voucherType: "Vehicle Delivery",
          voucherNo: veh!.vin,
          postingAt: new Date(),
        });
      }
    }

    // Post the sale to the GL: Debtors Dr total / Vehicle Sales + Accessory
    // Sales Cr — same revenue-posting pattern as Job Cards.
    const total = round2(price + accTotal);
    if (total > 0) {
      const debtors = await getAccountId(tx, "Debtors");
      const lines: { accountId: string; debit?: number; credit?: number }[] = [
        { accountId: debtors, debit: total },
      ];
      if (price > 0)
        lines.push({ accountId: await incomeAccountId(tx, "Vehicle Sales"), credit: price });
      if (accTotal > 0)
        lines.push({ accountId: await incomeAccountId(tx, "Accessory Sales"), credit: accTotal });
      await postGL(tx, {
        lines,
        voucherType: "Vehicle Delivery",
        voucherNo: veh!.vin,
        postingAt: new Date(),
        againstParty: customer,
      });
    }

    await logEvent(tx, {
      vehicleId: id,
      stage: "DELIVERED",
      note:
        values.note ||
        (total > 0
          ? `Handed over to ${customer} · sale posted to the ledger`
          : `Handed over to ${customer}`),
      dealerId: v.dealerId,
      by,
    });
  });
}

// Fit an accessory onto a vehicle at any stage before delivery. Recorded on the
// vehicle only — stock is issued and revenue posted later, at delivery.
export async function addVehicleAccessory(
  id: string,
  v: { itemId: string; qty: number; rate: number },
) {
  const veh = await prisma.vehicle.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!veh) throw new Error("Vehicle not found");
  if (veh.status === "DELIVERED")
    throw new Error("Vehicle already delivered — accessories are locked.");
  await prisma.vehicleAccessory.create({
    data: {
      vehicleId: id,
      itemId: v.itemId,
      qty: v.qty,
      rate: v.rate,
      amount: round2(v.qty * v.rate),
    },
  });
}

export async function removeVehicleAccessory(id: string, accessoryId: string) {
  const veh = await prisma.vehicle.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!veh) throw new Error("Vehicle not found");
  if (veh.status === "DELIVERED")
    throw new Error("Vehicle already delivered — accessories are locked.");
  await prisma.vehicleAccessory.deleteMany({
    where: { id: accessoryId, vehicleId: id },
  });
}

export async function getVehicleLifecycle(
  id: string,
): Promise<VehicleLifecycle | null> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!vehicle) return null;

  const [events, inspections, accRows] = await Promise.all([
    prisma.vehicleEvent.findMany({
      where: { vehicleId: id },
      orderBy: { at: "desc" },
    }),
    prisma.vehicleInspection.findMany({
      where: { vehicleId: id },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    }),
    prisma.vehicleAccessory.findMany({ where: { vehicleId: id } }),
  ]);

  // Resolve accessory item codes/names (loose ref to core Item).
  const accItemIds = [...new Set(accRows.map((a) => a.itemId))];
  const items = accItemIds.length
    ? await prisma.item.findMany({
        where: { id: { in: accItemIds } },
        select: { id: true, itemCode: true, itemName: true },
      })
    : [];
  const itemMap = new Map(items.map((i) => [i.id, i]));

  // Resolve dealer + warehouse names referenced by the events.
  const dealerIds = [...new Set(events.map((e) => e.dealerId).filter(Boolean))] as string[];
  const whIds = [...new Set(events.map((e) => e.warehouseId).filter(Boolean))] as string[];
  const [dealers, warehouses] = await Promise.all([
    dealerIds.length
      ? prisma.dealer.findMany({ where: { id: { in: dealerIds } }, select: { id: true, name: true } })
      : [],
    whIds.length
      ? prisma.warehouse.findMany({ where: { id: { in: whIds } }, select: { id: true, warehouseName: true } })
      : [],
  ]);
  const dealerMap = new Map(dealers.map((d) => [d.id, d.name]));
  const whMap = new Map(warehouses.map((w) => [w.id, w.warehouseName]));

  return {
    stage: vehicle.status,
    timeline: events.map((e) => ({
      id: e.id,
      stage: e.stage,
      note: e.note,
      dealer: e.dealerId ? (dealerMap.get(e.dealerId) ?? null) : null,
      warehouse: e.warehouseId ? (whMap.get(e.warehouseId) ?? null) : null,
      byUser: e.byUser,
      at: e.at.toISOString(),
    })),
    inspections: inspections.map((ins) => ({
      id: ins.id,
      inspector: ins.inspector,
      result: ins.result,
      note: ins.note,
      createdAt: ins.createdAt.toISOString(),
      items: ins.items.map((it) => ({ label: it.label, ok: it.ok, note: it.note })),
    })),
    accessories: accRows.map((a) => ({
      id: a.id,
      itemId: a.itemId,
      itemCode: itemMap.get(a.itemId)?.itemCode ?? "—",
      itemName: itemMap.get(a.itemId)?.itemName ?? "",
      qty: a.qty,
      rate: Number(a.rate),
      amount: Number(a.amount),
    })),
  };
}
