import { Prisma, VehicleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deliverVehicle } from "@/lib/services/vehicle-lifecycle";
import { parseSort, type ListParams, type ListResponse } from "@/lib/api-list";
import type {
  AvailableVehicle,
  BookingAnalytics,
  BookingDetail,
  BookingFormValues,
  BookingListItem,
} from "@/modules/dms/vehicle-bookings/schema";

const SORTABLE = ["name", "customerName", "model", "priority", "createdAt"] as const;

// A vehicle is "ready to allot" once it's at the dealer (incl. PDI passed) and
// not already tied to a booking.
const READY_STATUSES: VehicleStatus[] = ["AT_DEALER", "PDI_DONE"];

type Row = Prisma.VehicleBookingGetPayload<{
  include: {
    dealer: { select: { name: true } };
    vehicle: { select: { vin: true } };
  };
}>;

const INCLUDE = {
  dealer: { select: { name: true } },
  vehicle: { select: { vin: true, status: true } },
} as const;

// Position (1-based) of every BOOKED booking within its model's queue:
// priority first, then first-come-first-served.
async function queueMap(): Promise<Map<string, number>> {
  const booked = await prisma.vehicleBooking.findMany({
    where: { status: "BOOKED" },
    select: { id: true, model: true, priority: true, createdAt: true },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
  });
  const perModel = new Map<string, number>();
  const pos = new Map<string, number>();
  for (const b of booked) {
    const n = (perModel.get(b.model) ?? 0) + 1;
    perModel.set(b.model, n);
    pos.set(b.id, n);
  }
  return pos;
}

function toListItem(r: Row, queue: Map<string, number>): BookingListItem {
  return {
    id: r.id,
    name: r.name,
    customerName: r.customerName,
    phone: r.phone,
    model: r.model,
    variant: r.variant,
    color: r.color,
    dealerId: r.dealerId,
    dealerName: r.dealer?.name ?? null,
    priority: r.priority,
    advance: Number(r.advance),
    status: r.status,
    vehicleId: r.vehicleId,
    vin: r.vehicle?.vin ?? null,
    createdAt: r.createdAt.toISOString(),
    queuePosition: r.status === "BOOKED" ? (queue.get(r.id) ?? null) : null,
  };
}

function toData(v: BookingFormValues) {
  return {
    customerName: v.customerName.trim(),
    phone: v.phone?.trim() || null,
    customerId: v.customerId?.trim() || null,
    model: v.model.trim(),
    variant: v.variant?.trim() || null,
    color: v.color?.trim() || null,
    dealerId: v.dealerId?.trim() || null,
    priority: v.priority,
    advance: v.advance,
    note: v.note?.trim() || null,
  };
}

export async function listBookings(
  p: ListParams,
  filters: { status?: string; model?: string },
): Promise<ListResponse<BookingListItem>> {
  const where: Prisma.VehicleBookingWhereInput = {};
  if (filters.status && filters.status !== "all")
    where.status = filters.status as BookingListItem["status"];
  if (filters.model) where.model = filters.model;
  if (p.search)
    where.OR = [
      { name: { contains: p.search, mode: "insensitive" } },
      { customerName: { contains: p.search, mode: "insensitive" } },
      { model: { contains: p.search, mode: "insensitive" } },
      { phone: { contains: p.search, mode: "insensitive" } },
    ];
  const orderBy = parseSort(p.sort, SORTABLE, { createdAt: "desc" });

  const [rows, total, queue] = await Promise.all([
    prisma.vehicleBooking.findMany({
      where,
      orderBy,
      skip: (p.page - 1) * p.limit,
      take: p.limit,
      include: INCLUDE,
    }),
    prisma.vehicleBooking.count({ where }),
    queueMap(),
  ]);
  return {
    rows: rows.map((r) => toListItem(r, queue)),
    total,
    page: p.page,
    limit: p.limit,
  };
}

// Distinct model / variant / colour values already used anywhere in the system
// (vehicles + existing bookings) — powers the "pick or type" suggestions on the
// booking form so the per-model queue doesn't fragment on typos.
export async function vehicleCatalogue(): Promise<{
  models: string[];
  variants: string[];
  colors: string[];
}> {
  const [vehicles, bookings] = await Promise.all([
    prisma.vehicle.findMany({
      select: { model: true, variant: true, color: true },
    }),
    prisma.vehicleBooking.findMany({
      select: { model: true, variant: true, color: true },
    }),
  ]);
  const rows = [...vehicles, ...bookings];
  const uniq = (xs: (string | null)[]) =>
    [...new Set(xs.map((s) => s?.trim()).filter((s): s is string => !!s))].sort(
      (a, b) => a.localeCompare(b),
    );
  return {
    models: uniq(rows.map((r) => r.model)),
    variants: uniq(rows.map((r) => r.variant)),
    colors: uniq(rows.map((r) => r.color)),
  };
}

export async function bookingAnalytics(): Promise<BookingAnalytics> {
  const [grouped, adv, bookedByModel] = await Promise.all([
    prisma.vehicleBooking.groupBy({ by: ["status"], _count: true }),
    prisma.vehicleBooking.aggregate({ _sum: { advance: true } }),
    prisma.vehicleBooking.groupBy({
      by: ["model"],
      where: { status: "BOOKED" },
      _count: true,
    }),
  ]);
  const countFor = (s: string) =>
    grouped.find((g) => g.status === s)?._count ?? 0;
  return {
    total: grouped.reduce((n, g) => n + g._count, 0),
    booked: countFor("BOOKED"),
    allotted: countFor("ALLOTTED"),
    delivered: countFor("DELIVERED"),
    cancelled: countFor("CANCELLED"),
    advanceCollected: Number(adv._sum.advance ?? 0),
    byModel: bookedByModel
      .map((m) => ({ name: m.model, value: m._count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8),
  };
}

export async function getBookingById(id: string): Promise<BookingDetail | null> {
  const [r, queue] = await Promise.all([
    prisma.vehicleBooking.findUnique({ where: { id }, include: INCLUDE }),
    queueMap(),
  ]);
  if (!r) return null;
  return {
    ...toListItem(r, queue),
    note: r.note,
    vehicleStatus: r.vehicle?.status ?? null,
    allottedAt: r.allottedAt ? r.allottedAt.toISOString() : null,
    deliveredAt: r.deliveredAt ? r.deliveredAt.toISOString() : null,
    cancelledAt: r.cancelledAt ? r.cancelledAt.toISOString() : null,
  };
}

// Vehicles that could be allotted to this booking: same model, ready to hand
// over, and not already tied to another booking.
export async function availableVehicles(
  bookingId: string,
): Promise<AvailableVehicle[]> {
  const b = await prisma.vehicleBooking.findUnique({ where: { id: bookingId } });
  if (!b) return [];
  const rows = await prisma.vehicle.findMany({
    where: {
      model: b.model,
      status: { in: READY_STATUSES },
      booking: null, // no booking currently tied to this vehicle
      ...(b.variant ? { variant: b.variant } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      vin: true,
      model: true,
      variant: true,
      color: true,
      status: true,
    },
  });
  return rows.map((v) => ({ ...v, status: v.status }));
}

export async function createBooking(
  values: BookingFormValues,
): Promise<{ id: string; name: string }> {
  const year = new Date().getFullYear();
  const count = await prisma.vehicleBooking.count();
  const name = `BKG-${year}-${String(count + 1).padStart(5, "0")}`;
  const r = await prisma.vehicleBooking.create({
    data: { name, ...toData(values) },
  });
  return { id: r.id, name };
}

export async function updateBooking(
  id: string,
  values: BookingFormValues,
): Promise<{ id: string }> {
  const b = await prisma.vehicleBooking.findUnique({ where: { id } });
  if (!b) throw new Error("Booking not found");
  if (b.status !== "BOOKED")
    throw new Error("Only booked (unallotted) bookings can be edited");
  await prisma.vehicleBooking.update({ where: { id }, data: toData(values) });
  return { id };
}

export async function deleteBooking(id: string): Promise<void> {
  const b = await prisma.vehicleBooking.findUnique({ where: { id } });
  if (!b) throw new Error("Booking not found");
  if (b.status === "ALLOTTED" || b.status === "DELIVERED")
    throw new Error("Allotted or delivered bookings can't be deleted — cancel instead");
  await prisma.vehicleBooking.delete({ where: { id } });
}

// Allot a specific available vehicle to a booking.
export async function allotBooking(
  id: string,
  vehicleId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const b = await tx.vehicleBooking.findUnique({ where: { id } });
    if (!b) throw new Error("Booking not found");
    if (b.status !== "BOOKED")
      throw new Error("Only booked entries can be allotted a vehicle");
    const v = await tx.vehicle.findUnique({
      where: { id: vehicleId },
      include: { booking: { select: { id: true } } },
    });
    if (!v) throw new Error("Vehicle not found");
    if (v.booking) throw new Error("That vehicle is already on another booking");
    if (!READY_STATUSES.includes(v.status))
      throw new Error("That vehicle isn't ready to hand over yet");
    if (v.model !== b.model)
      throw new Error(`Vehicle model "${v.model}" doesn't match the booking`);
    await tx.vehicleBooking.update({
      where: { id },
      data: { status: "ALLOTTED", vehicleId, allottedAt: new Date() },
    });
  });
}

// Allot the oldest ready vehicle automatically (FEFO-style, oldest stock first).
export async function allotNextVehicle(id: string): Promise<void> {
  const list = await availableVehicles(id);
  if (list.length === 0)
    throw new Error("No matching vehicle is ready to allot right now");
  await allotBooking(id, list[0].id);
}

// Delivering a booking drives the real vehicle hand-over: the allotted vehicle
// must have passed PDI, then it moves to DELIVERED and the sale posts to the GL
// (via deliverVehicle) — so a booked car can't also be sold to someone else.
export async function deliverBooking(
  id: string,
  by?: string | null,
): Promise<void> {
  const b = await prisma.vehicleBooking.findUnique({
    where: { id },
    include: { vehicle: { select: { id: true, status: true } } },
  });
  if (!b) throw new Error("Booking not found");
  if (b.status !== "ALLOTTED")
    throw new Error("Only an allotted booking can be delivered");
  if (!b.vehicle) throw new Error("This booking has no vehicle allotted");
  if (b.vehicle.status === "DELIVERED") {
    // Vehicle already handed over (e.g. delivered from its own page) — just
    // close the booking so the queue stays consistent.
    await prisma.vehicleBooking.update({
      where: { id },
      data: { status: "DELIVERED", deliveredAt: new Date() },
    });
    return;
  }
  if (b.vehicle.status !== "PDI_DONE")
    throw new Error(
      `Run PDI on the vehicle before delivery (it's "${b.vehicle.status}").`,
    );

  // Hand over the vehicle itself — posts the sale + moves it to DELIVERED.
  // skipBookingCheck: this delivery IS the booking, so the reservation guard
  // in deliverVehicle must not block it.
  await deliverVehicle(
    b.vehicle.id,
    { customerName: b.customerName, customerId: b.customerId ?? undefined },
    by,
    { skipBookingCheck: true },
  );
  await prisma.vehicleBooking.update({
    where: { id },
    data: { status: "DELIVERED", deliveredAt: new Date() },
  });
}

export async function cancelBooking(id: string): Promise<void> {
  const b = await prisma.vehicleBooking.findUnique({ where: { id } });
  if (!b) throw new Error("Booking not found");
  if (b.status === "DELIVERED")
    throw new Error("A delivered booking can't be cancelled");
  // Free the allotted vehicle back to the pool.
  await prisma.vehicleBooking.update({
    where: { id },
    data: { status: "CANCELLED", vehicleId: null, cancelledAt: new Date() },
  });
}
