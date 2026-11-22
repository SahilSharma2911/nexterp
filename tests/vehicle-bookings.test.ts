import { describe, it, expect, beforeEach } from "vitest";
import {
  createBooking,
  updateBooking,
  deleteBooking,
  listBookings,
  bookingAnalytics,
  vehicleCatalogue,
  getBookingById,
  availableVehicles,
  allotBooking,
  allotNextVehicle,
  deliverBooking,
  cancelBooking,
} from "@/lib/services/vehicle-bookings";
import { deliverVehicle } from "@/lib/services/vehicle-lifecycle";
import { emptyBooking } from "@/modules/dms/vehicle-bookings/schema";
import { prisma } from "@/lib/prisma";
import { resetDb, makeVehicle, seedAccounts, glFor } from "./helpers";

const form = (over: Partial<typeof emptyBooking> = {}) => ({
  ...emptyBooking,
  customerName: "Asha",
  model: "Test EV",
  ...over,
});

const LP = { page: 1, limit: 50, sort: "", search: "" };

describe("vehicle bookings service", () => {
  beforeEach(resetDb);

  it("creates a booking with a sequential name", async () => {
    const a = await createBooking(form());
    const b = await createBooking(form({ customerName: "Ben" }));
    expect(a.name).toMatch(/^BKG-\d{4}-00001$/);
    expect(b.name).toMatch(/^BKG-\d{4}-00002$/);
  });

  it("orders the queue by priority then first-come-first-served", async () => {
    const first = await createBooking(form({ customerName: "First" })); // normal
    const second = await createBooking(form({ customerName: "Second" })); // normal
    const vip = await createBooking(form({ customerName: "VIP", priority: 1 }));

    const { rows } = await listBookings(LP, {});
    const pos = (id: string) =>
      rows.find((r) => r.id === id)!.queuePosition;

    // High priority jumps the queue; same-priority keeps FCFS order.
    expect(pos(vip.id)).toBe(1);
    expect(pos(first.id)).toBe(2);
    expect(pos(second.id)).toBe(3);
  });

  it("queues per-model (separate models have their own #1)", async () => {
    const ev = await createBooking(form({ model: "City EV" }));
    const scooter = await createBooking(form({ model: "Zip Scooter" }));
    const { rows } = await listBookings(LP, {});
    expect(rows.find((r) => r.id === ev.id)!.queuePosition).toBe(1);
    expect(rows.find((r) => r.id === scooter.id)!.queuePosition).toBe(1);
  });

  it("only offers ready, matching, un-booked vehicles", async () => {
    const booking = await createBooking(form({ model: "City EV" }));
    const ready = await makeVehicle("VIN-READY", {
      model: "City EV",
      status: "AT_DEALER",
    });
    await makeVehicle("VIN-INSTOCK", { model: "City EV", status: "IN_STOCK" }); // not ready
    await makeVehicle("VIN-OTHER", { model: "Other EV", status: "AT_DEALER" }); // wrong model

    const avail = await availableVehicles(booking.id);
    expect(avail.map((v) => v.id)).toEqual([ready.id]);
  });

  it("matches variant when the booking specifies one", async () => {
    const booking = await createBooking(form({ model: "City EV", variant: "LR" }));
    const lr = await makeVehicle("VIN-LR", {
      model: "City EV",
      variant: "LR",
      status: "PDI_DONE",
    });
    await makeVehicle("VIN-SR", {
      model: "City EV",
      variant: "SR",
      status: "PDI_DONE",
    });
    const avail = await availableVehicles(booking.id);
    expect(avail.map((v) => v.id)).toEqual([lr.id]);
  });

  it("allots a specific vehicle and moves to ALLOTTED", async () => {
    const booking = await createBooking(form({ model: "City EV" }));
    const v = await makeVehicle("VIN-1", { model: "City EV", status: "AT_DEALER" });
    await allotBooking(booking.id, v.id);

    const d = await getBookingById(booking.id);
    expect(d?.status).toBe("ALLOTTED");
    expect(d?.vehicleId).toBe(v.id);
    expect(d?.allottedAt).toBeTruthy();
  });

  it("refuses to allot a vehicle of the wrong model", async () => {
    const booking = await createBooking(form({ model: "City EV" }));
    const v = await makeVehicle("VIN-X", { model: "Other EV", status: "AT_DEALER" });
    await expect(allotBooking(booking.id, v.id)).rejects.toThrow(/doesn't match/i);
  });

  it("refuses to allot the same vehicle to two bookings", async () => {
    const a = await createBooking(form({ model: "City EV" }));
    const b = await createBooking(form({ model: "City EV", customerName: "Ben" }));
    const v = await makeVehicle("VIN-1", { model: "City EV", status: "AT_DEALER" });
    await allotBooking(a.id, v.id);
    await expect(allotBooking(b.id, v.id)).rejects.toThrow(/already on another/i);
  });

  it("auto-allots the oldest ready vehicle", async () => {
    const booking = await createBooking(form({ model: "City EV" }));
    const older = await makeVehicle("VIN-OLD", {
      model: "City EV",
      status: "AT_DEALER",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    });
    // a strictly later createdAt so "oldest first" is unambiguous
    await makeVehicle("VIN-NEW", {
      model: "City EV",
      status: "AT_DEALER",
      createdAt: new Date("2024-06-01T00:00:00Z"),
    });

    await allotNextVehicle(booking.id);
    const d = await getBookingById(booking.id);
    expect(d?.vehicleId).toBe(older.id);
  });

  it("throws when nothing is ready to auto-allot", async () => {
    const booking = await createBooking(form({ model: "City EV" }));
    await expect(allotNextVehicle(booking.id)).rejects.toThrow(/no matching/i);
  });

  it("delivers an allotted booking and hands over the vehicle", async () => {
    const booking = await createBooking(form({ model: "City EV" }));
    const v = await makeVehicle("VIN-1", { model: "City EV", status: "PDI_DONE" });
    await allotBooking(booking.id, v.id);
    await deliverBooking(booking.id);

    const d = await getBookingById(booking.id);
    expect(d?.status).toBe("DELIVERED");
    expect(d?.deliveredAt).toBeTruthy();

    // the real vehicle lifecycle advanced too — so it can't be sold again
    const veh = await prisma.vehicle.findUnique({ where: { id: v.id } });
    expect(veh?.status).toBe("DELIVERED");
    expect(veh?.customerName).toBe("Asha");
  });

  it("won't deliver until the allotted vehicle has passed PDI", async () => {
    const booking = await createBooking(form({ model: "City EV" }));
    const v = await makeVehicle("VIN-1", { model: "City EV", status: "AT_DEALER" });
    await allotBooking(booking.id, v.id);
    await expect(deliverBooking(booking.id)).rejects.toThrow(/PDI/i);
  });

  it("posts the vehicle sale to the GL on delivery", async () => {
    await seedAccounts();
    const booking = await createBooking(form({ model: "City EV" }));
    const v = await makeVehicle("VIN-SALE", {
      model: "City EV",
      status: "PDI_DONE",
      sellingRate: 150000,
    });
    await allotBooking(booking.id, v.id);
    await deliverBooking(booking.id);

    const gl = await glFor("VIN-SALE");
    expect(gl.length).toBeGreaterThan(0);
    const debit = gl.reduce((s, e) => s + Number(e.debit), 0);
    const credit = gl.reduce((s, e) => s + Number(e.credit), 0);
    expect(debit).toBe(150000);
    expect(credit).toBe(150000);
  });

  it("blocks selling a reserved vehicle directly from the vehicle page", async () => {
    const booking = await createBooking(form({ model: "City EV" }));
    const v = await makeVehicle("VIN-1", { model: "City EV", status: "PDI_DONE" });
    await allotBooking(booking.id, v.id);

    // Someone tries to deliver the car to a different customer via its own flow.
    await expect(
      deliverVehicle(v.id, { customerName: "Someone Else" }),
    ).rejects.toThrow(/reserved for booking/i);

    // The booking's own delivery still goes through (bypasses the guard).
    await deliverBooking(booking.id);
    const veh = await prisma.vehicle.findUnique({ where: { id: v.id } });
    expect(veh?.status).toBe("DELIVERED");
  });

  it("won't deliver a booking that isn't allotted", async () => {
    const booking = await createBooking(form());
    await expect(deliverBooking(booking.id)).rejects.toThrow(/allotted/i);
  });

  it("cancelling releases the allotted vehicle back to the pool", async () => {
    const booking = await createBooking(form({ model: "City EV" }));
    const v = await makeVehicle("VIN-1", { model: "City EV", status: "AT_DEALER" });
    await allotBooking(booking.id, v.id);
    await cancelBooking(booking.id);

    const d = await getBookingById(booking.id);
    expect(d?.status).toBe("CANCELLED");
    expect(d?.vehicleId).toBeNull();

    // the freed vehicle is offerable again on a fresh booking
    const next = await createBooking(form({ model: "City EV", customerName: "Ben" }));
    const avail = await availableVehicles(next.id);
    expect(avail.map((x) => x.id)).toContain(v.id);
  });

  it("won't cancel a delivered booking", async () => {
    const booking = await createBooking(form({ model: "City EV" }));
    const v = await makeVehicle("VIN-1", { model: "City EV", status: "PDI_DONE" });
    await allotBooking(booking.id, v.id);
    await deliverBooking(booking.id);
    await expect(cancelBooking(booking.id)).rejects.toThrow(/delivered/i);
  });

  it("only edits / deletes bookings still in the queue", async () => {
    const booking = await createBooking(form({ model: "City EV" }));
    const v = await makeVehicle("VIN-1", { model: "City EV", status: "AT_DEALER" });
    await allotBooking(booking.id, v.id);

    await expect(
      updateBooking(booking.id, form({ customerName: "Changed" })),
    ).rejects.toThrow(/booked/i);
    await expect(deleteBooking(booking.id)).rejects.toThrow(/cancel instead/i);
  });

  it("builds a de-duped catalogue from vehicles + bookings", async () => {
    await makeVehicle("VIN-A", { model: "City EV", variant: "LR", color: "Blue" });
    await makeVehicle("VIN-B", { model: "Zip", variant: "LR", color: "Red" });
    await createBooking(form({ model: "City EV", variant: "SR", color: "Blue" }));
    await createBooking(form({ model: "Nova", customerName: "Ben" }));

    const cat = await vehicleCatalogue();
    // distinct + sorted, merged across both tables
    expect(cat.models).toEqual(["City EV", "Nova", "Zip"]);
    expect(cat.variants).toEqual(["LR", "SR"]);
    expect(cat.colors).toEqual(["Blue", "Red"]);
  });

  it("summarises counts and open demand", async () => {
    const b1 = await createBooking(form({ model: "City EV", advance: 5000 }));
    await createBooking(form({ model: "City EV", customerName: "Ben" }));
    await createBooking(form({ model: "Zip", customerName: "Cara" }));
    const v = await makeVehicle("VIN-1", { model: "City EV", status: "AT_DEALER" });
    await allotBooking(b1.id, v.id);

    const a = await bookingAnalytics();
    expect(a.total).toBe(3);
    expect(a.allotted).toBe(1);
    expect(a.booked).toBe(2);
    expect(a.advanceCollected).toBe(5000);
    // open demand excludes the allotted City EV, leaving City EV(1) + Zip(1)
    const demand = Object.fromEntries(a.byModel.map((m) => [m.name, m.value]));
    expect(demand["City EV"]).toBe(1);
    expect(demand["Zip"]).toBe(1);
  });
});
