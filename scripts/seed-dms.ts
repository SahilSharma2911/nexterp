/**
 * Demo DMS data: dealers + vehicles spread across lifecycle stages.
 * Run:  npm run seed:dms   (writes to DATABASE_URL in .env — your local dev DB)
 *
 * Safe to re-run: clears existing DMS vehicles/dealers first.
 */
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { seedStandardChart } from "../lib/services/chart-of-accounts";
import {
  allocateVehicle,
  dispatchVehicle,
  receiveVehicleAtDealer,
  recordPdi,
  deliverVehicle,
} from "../lib/services/vehicle-lifecycle";

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
  await prisma.jobCard.deleteMany();
  await prisma.vehicle.deleteMany(); // cascades events + inspections
  await prisma.dealer.deleteMany();
  await prisma.gLEntry.deleteMany({ where: { voucherType: "Vehicle Delivery" } });
}

async function main() {
  await seedStandardChart();
  await wipe();

  // A warehouse for incoming units (reuse one if it exists).
  const warehouse =
    (await prisma.warehouse.findFirst()) ??
    (await prisma.warehouse.create({
      data: { warehouseName: "Central EV Warehouse", warehouseType: "Stores" },
    }));

  const dealers = await Promise.all(
    [
      ["DLR-MUM", "Metro EV Motors", "Mumbai", "MH"],
      ["DLR-BLR", "Coastal EV", "Bengaluru", "KA"],
      ["DLR-DEL", "Capital EV Hub", "New Delhi", "DL"],
    ].map(([code, name, city, state]) =>
      prisma.dealer.create({
        data: { code, name, city, state, contactPerson: "Sales Desk" },
      }),
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

  // Leave [0,1,2] at warehouse. Advance the rest through stages.
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

  await allocateVehicle(vehicles[9].id, { dealerId: d(0) }, by);
  await dispatchVehicle(vehicles[9].id, undefined, by);
  await receiveVehicleAtDealer(vehicles[9].id, undefined, by);
  await recordPdi(vehicles[9].id, { inspector: "A. Khan", items: PDI }, by);

  const buyers = ["Anita Rao", "Vikram Shah"];
  for (let k = 0; k < 2; k++) {
    const v = vehicles[10 + k];
    await allocateVehicle(v.id, { dealerId: d(k) }, by);
    await dispatchVehicle(v.id, undefined, by);
    await receiveVehicleAtDealer(v.id, undefined, by);
    await recordPdi(v.id, { inspector: "A. Khan", items: PDI }, by);
    await deliverVehicle(v.id, { customerName: buyers[k] }, by);
  }

  const byStage = await prisma.vehicle.groupBy({
    by: ["status"],
    _count: true,
  });
  console.log(
    "Seeded",
    vehicles.length,
    "vehicles,",
    dealers.length,
    "dealers.",
  );
  console.log("By stage:", JSON.stringify(byStage.map((s) => ({ [s.status]: s._count }))));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
