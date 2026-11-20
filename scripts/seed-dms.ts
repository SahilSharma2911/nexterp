/**
 * Demo DMS data: dealers + vehicles across lifecycle stages, plus spare-part &
 * accessory items (stocked), job cards, warranties, and accessories sold at
 * delivery — so every DMS screen has something to show.
 *
 * Run:  npm run seed:dms   (writes to DATABASE_URL in .env — your local dev DB)
 * Safe to re-run: clears existing DMS data first (top-ups stock each run).
 */
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { postStockLedger } from "../lib/stock-ledger";
import { seedStandardChart } from "../lib/services/chart-of-accounts";
import {
  allocateVehicle,
  dispatchVehicle,
  receiveVehicleAtDealer,
  recordPdi,
  deliverVehicle,
} from "../lib/services/vehicle-lifecycle";
import { createJobCard, completeJobCard } from "../lib/services/job-cards";
import { createWarranty } from "../lib/services/warranties";
import {
  createServiceAppointment,
  startServiceAppointment,
} from "../lib/services/service-appointments";

const today = new Date().toISOString().slice(0, 10);
const PDI = [
  { label: "Battery State of Health", ok: true, note: "" },
  { label: "Motor & controller", ok: true, note: "" },
  { label: "Brakes", ok: true, note: "" },
  { label: "Lights & indicators", ok: true, note: "" },
];

async function wipe() {
  await prisma.subsidyClaim.deleteMany();
  await prisma.warrantyClaim.deleteMany();
  await prisma.warranty.deleteMany();
  await prisma.serviceAppointment.deleteMany(); // FK to jobCard + vehicle
  await prisma.jobCard.deleteMany();
  await prisma.technician.deleteMany();
  await prisma.serviceBay.deleteMany();
  await prisma.vehicle.deleteMany(); // cascades events + inspections + accessories
  await prisma.dealer.deleteMany();
  await prisma.gLEntry.deleteMany({
    where: { voucherType: { in: ["Vehicle Delivery", "Job Card"] } },
  });
}

async function upsertItem(
  itemCode: string,
  itemName: string,
  rate: number,
  group: string,
  barcode: string,
) {
  return prisma.item.upsert({
    where: { itemCode },
    update: { itemName, valuationRate: rate, itemGroup: group, barcode },
    create: { itemCode, itemName, valuationRate: rate, itemGroup: group, barcode },
  });
}

async function stock(itemId: string, warehouseId: string, qty: number, rate: number) {
  await prisma.$transaction((tx) =>
    postStockLedger(tx, {
      itemId,
      warehouseId,
      actualQty: qty,
      incomingRate: rate,
      voucherType: "SEED-STOCK",
      voucherNo: "SEED",
      postingAt: new Date(),
    }),
  );
}

async function main() {
  await seedStandardChart();
  await wipe();

  const warehouse =
    (await prisma.warehouse.findFirst()) ??
    (await prisma.warehouse.create({
      data: { warehouseName: "Central EV Warehouse", warehouseType: "Stores" },
    }));

  // Spare parts + accessories (Items), with stock to draw from.
  const parts = {
    brake: await upsertItem("SP-BRAKE", "Brake Pad Set", 800, "Spare Parts", "8906001000017"),
    charger: await upsertItem("SP-CHARGER", "Portable Charger", 3500, "Spare Parts", "8906001000024"),
    coolant: await upsertItem("SP-COOLANT", "Coolant 1L", 400, "Spare Parts", "8906001000031"),
  };
  const acc = {
    helmet: await upsertItem("ACC-HELMET", "Helmet", 1500, "Accessories", "8906001000048"),
    mat: await upsertItem("ACC-MAT", "Floor Mat Set", 900, "Accessories", "8906001000055"),
    seat: await upsertItem("ACC-SEAT", "Seat Cover", 1200, "Accessories", "8906001000062"),
  };
  for (const it of [...Object.values(parts), ...Object.values(acc)])
    await stock(it.id, warehouse.id, 100, Number(it.valuationRate));

  // Service & Workshop masters — technicians (some HV-certified) + bays.
  const techs = {
    ravi: await prisma.technician.create({
      data: {
        name: "Ravi Kumar",
        skills: "Brakes, suspension, general service",
        isHVCertified: false,
        active: true,
      },
    }),
    priya: await prisma.technician.create({
      data: {
        name: "Priya Nair",
        skills: "Battery diagnostics, BMS, motor",
        isHVCertified: true,
        active: true,
      },
    }),
    arjun: await prisma.technician.create({
      data: {
        name: "Arjun Mehta",
        skills: "HV systems, charger, controller",
        isHVCertified: true,
        active: true,
      },
    }),
  };
  const bays = {
    bay1: await prisma.serviceBay.create({
      data: { name: "Bay 1", isHV: false, active: true },
    }),
    bay2: await prisma.serviceBay.create({
      data: { name: "Bay 2", isHV: false, active: true },
    }),
    hvBay: await prisma.serviceBay.create({
      data: { name: "HV Bay 1", isHV: true, active: true },
    }),
  };

  const dealers = await Promise.all(
    [
      ["DLR-MUM", "Metro EV Motors", "Mumbai", "MH"],
      ["DLR-BLR", "Coastal EV", "Bengaluru", "KA"],
      ["DLR-DEL", "Capital EV Hub", "New Delhi", "DL"],
    ].map(([code, name, city, state]) =>
      prisma.dealer.create({ data: { code, name, city, state, contactPerson: "Sales Desk" } }),
    ),
  );

  const specs = [
    ["Volt City", "Standard", "Pearl White", 650000, 799000],
    ["Volt City", "Long Range", "Midnight Blue", 720000, 879000],
    ["Volt City", "Standard", "Graphite Grey", 650000, 799000],
    ["Volt Prime", "Performance", "Racing Red", 980000, 1199000],
    ["Volt Prime", "Performance", "Pearl White", 980000, 1199000],
    ["Volt Cargo", "Max", "Fleet White", 560000, 679000],
    ["Volt Cargo", "Max", "Fleet White", 560000, 679000],
    ["Volt City", "Long Range", "Ocean Teal", 720000, 879000],
    ["Volt Prime", "Performance", "Midnight Blue", 980000, 1199000],
    ["Volt City", "Standard", "Sunrise Yellow", 650000, 799000],
    ["Volt Cargo", "Max", "Fleet White", 560000, 679000],
    ["Volt City", "Long Range", "Pearl White", 720000, 879000],
  ] as const;

  const vehicles = [];
  for (let i = 0; i < specs.length; i++) {
    const [model, variant, color, purchaseRate, sellingRate] = specs[i];
    const n = String(i + 1).padStart(4, "0");
    vehicles.push(
      await prisma.vehicle.create({
        data: {
          vin: `MD9EV26A${n}XY`,
          model,
          variant,
          color,
          motorSerial: `MOT-26-${n}`,
          batterySerial: `BAT-26-${n}`,
          batterySoH: 97 + (i % 4),
          purchaseRate,
          sellingRate,
          warehouseId: warehouse.id,
          status: "IN_STOCK",
        },
      }),
    );
  }

  const by = "Demo";
  const d = (i: number) => dealers[i % dealers.length].id;

  // [0,1,2] stay at warehouse. Advance the rest.
  await allocateVehicle(vehicles[3].id, { dealerId: d(0) }, by);
  await allocateVehicle(vehicles[4].id, { dealerId: d(1) }, by);

  for (const v of [vehicles[5], vehicles[6]]) {
    await allocateVehicle(v.id, { dealerId: d(1) }, by);
    await dispatchVehicle(v.id, "Loaded on carrier", by);
  }
  for (const v of [vehicles[7], vehicles[8]]) {
    await allocateVehicle(v.id, { dealerId: d(2) }, by);
    await dispatchVehicle(v.id, undefined, by);
    await receiveVehicleAtDealer(v.id, "Unloaded at showroom", by);
  }

  // One at PDI_DONE.
  const ready = vehicles[9];
  await allocateVehicle(ready.id, { dealerId: d(0) }, by);
  await dispatchVehicle(ready.id, undefined, by);
  await receiveVehicleAtDealer(ready.id, undefined, by);
  await recordPdi(ready.id, { inspector: "A. Khan", items: PDI }, by);

  // Two delivered — with accessories sold at handover.
  const buyers = ["Anita Rao", "Vikram Shah"];
  const deliveredIds: string[] = [];
  for (let k = 0; k < 2; k++) {
    const v = vehicles[10 + k];
    await allocateVehicle(v.id, { dealerId: d(k) }, by);
    await dispatchVehicle(v.id, undefined, by);
    await receiveVehicleAtDealer(v.id, undefined, by);
    await recordPdi(v.id, { inspector: "A. Khan", items: PDI }, by);
    await deliverVehicle(
      v.id,
      {
        customerName: buyers[k],
        accessories: [
          { itemId: acc.helmet.id, qty: 1, rate: 1500 },
          { itemId: acc.mat.id, qty: 1, rate: 900 },
        ],
      },
      by,
    );
    deliveredIds.push(v.id);
  }

  // Warranties on the delivered vehicles.
  for (const vehicleId of deliveredIds) {
    await createWarranty({
      vehicleId,
      component: "VEHICLE",
      startDate: today,
      months: 36,
      kmLimit: 100000,
      soHThreshold: null,
      status: "ACTIVE",
      notes: "Bumper-to-bumper",
    });
    await createWarranty({
      vehicleId,
      component: "BATTERY",
      startDate: today,
      months: 96,
      kmLimit: null,
      soHThreshold: 70,
      status: "ACTIVE",
      notes: "Battery degradation",
    });
  }

  // Job cards (one on a delivered car, one at a dealer) with parts + labour.
  const serviceVehicles = [deliveredIds[0], vehicles[7].id];
  for (let i = 0; i < serviceVehicles.length; i++) {
    const jc = await createJobCard({
      vehicleId: serviceVehicles[i],
      warehouseId: warehouse.id,
      technician: "Ravi Kumar",
      complaint: i === 0 ? "First free service" : "Brake noise",
      odometer: 1500 + i * 800,
      serviceDate: today,
      parts: [
        { itemId: parts.brake.id, qty: 1, rate: 1000 },
        { itemId: parts.coolant.id, qty: 2, rate: 500 },
      ],
      labor: [{ description: "General service", hours: 1.5, rate: 400 }],
      photos: [],
      remarks: "",
    });
    await completeJobCard(jc.id);
  }

  // Service appointments — a standard booking, an HV booking, and one already
  // converted into a job card (exercises the HV rule + conversion).
  await createServiceAppointment({
    vehicleId: deliveredIds[0],
    customerName: "Anita Rao",
    requestedAt: `${today}T10:00`,
    isHV: false,
    bayId: bays.bay1.id,
    technicianId: techs.ravi.id,
    complaint: "Scheduled service — 5,000 km",
    remarks: "",
  });
  await createServiceAppointment({
    vehicleId: deliveredIds[1],
    customerName: "Vikram Shah",
    requestedAt: `${today}T14:30`,
    isHV: true,
    bayId: bays.hvBay.id,
    technicianId: techs.priya.id,
    complaint: "Battery health check — range drop reported",
    remarks: "HV-certified tech + HV bay required",
  });
  const converted = await createServiceAppointment({
    vehicleId: vehicles[7].id,
    customerName: "Walk-in",
    requestedAt: `${today}T09:00`,
    isHV: false,
    bayId: bays.bay2.id,
    technicianId: techs.ravi.id,
    complaint: "Brake noise",
    remarks: "",
  });
  await startServiceAppointment(converted.id);

  // Allocation demand for the FIFO engine (matchable Volt City + a short one).
  await prisma.allocationRequest.create({
    data: {
      name: "ALLOC-" + today.slice(0, 4) + "-00001",
      dealerId: dealers[0].id,
      model: "Volt City",
      qty: 2,
      priority: 1,
      note: "Festive demand",
    },
  });
  await prisma.allocationRequest.create({
    data: {
      name: "ALLOC-" + today.slice(0, 4) + "-00002",
      dealerId: dealers[1].id,
      model: "Volt Prime",
      variant: "Performance",
      qty: 1,
      priority: 2,
    },
  });

  const byStage = await prisma.vehicle.groupBy({ by: ["status"], _count: true });
  console.log(`Seeded ${vehicles.length} vehicles, ${dealers.length} dealers.`);
  console.log("By stage:", JSON.stringify(byStage.map((s) => ({ [s.status]: s._count }))));
  console.log(
    `Items: ${Object.keys(parts).length} spare parts, ${Object.keys(acc).length} accessories. ` +
      `Job cards: 3. Warranties: ${deliveredIds.length * 2}.`,
  );
  console.log(
    `Service & Workshop: ${Object.keys(techs).length} technicians, ` +
      `${Object.keys(bays).length} bays, 3 appointments (1 converted).`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
