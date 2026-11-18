import { describe, it, expect, beforeEach } from "vitest";
import {
  createServiceAppointment,
  startServiceAppointment,
  cancelServiceAppointment,
  deleteServiceAppointment,
  getServiceAppointment,
} from "@/lib/services/service-appointments";
import { recordJobCardQc, createJobCard } from "@/lib/services/job-cards";
import { prisma } from "@/lib/prisma";
import { resetDb, makeVehicle } from "./helpers";

async function setup() {
  const vehicle = await makeVehicle("VIN-SW");
  const hvTech = await prisma.technician.create({
    data: { name: "HV Tech", isHVCertified: true },
  });
  const stdTech = await prisma.technician.create({
    data: { name: "Std Tech", isHVCertified: false },
  });
  const hvBay = await prisma.serviceBay.create({
    data: { name: "HV Bay", isHV: true },
  });
  const stdBay = await prisma.serviceBay.create({
    data: { name: "Std Bay", isHV: false },
  });
  return {
    vehicleId: vehicle.id,
    hvTech: hvTech.id,
    stdTech: stdTech.id,
    hvBay: hvBay.id,
    stdBay: stdBay.id,
  };
}

const base = (vehicleId: string) => ({
  vehicleId,
  customerName: "Test Buyer",
  requestedAt: "2026-11-18T10:00",
  isHV: false,
  bayId: "",
  technicianId: "",
  complaint: "Service",
  remarks: "",
});

describe("service & workshop — appointments", () => {
  beforeEach(resetDb);

  it("books an appointment and reads it back", async () => {
    const { vehicleId, stdBay, stdTech } = await setup();
    const { id, name } = await createServiceAppointment({
      ...base(vehicleId),
      bayId: stdBay,
      technicianId: stdTech,
    });
    expect(name).toMatch(/^APPT-\d{4}-\d{5}$/);
    const a = await getServiceAppointment(id);
    expect(a?.status).toBe("BOOKED");
    expect(a?.bay).toBe("Std Bay");
    expect(a?.technician).toBe("Std Tech");
  });

  it("enforces the HV rule on assignment", async () => {
    const { vehicleId, hvTech, stdTech, hvBay, stdBay } = await setup();
    // HV work + non-HV bay → rejected
    await expect(
      createServiceAppointment({
        ...base(vehicleId),
        isHV: true,
        bayId: stdBay,
        technicianId: hvTech,
      }),
    ).rejects.toThrow(/high-voltage|HV/i);
    // HV work + non-certified technician → rejected
    await expect(
      createServiceAppointment({
        ...base(vehicleId),
        isHV: true,
        bayId: hvBay,
        technicianId: stdTech,
      }),
    ).rejects.toThrow(/HV-certified/i);
    // HV work + HV bay + HV tech → allowed
    const ok = await createServiceAppointment({
      ...base(vehicleId),
      isHV: true,
      bayId: hvBay,
      technicianId: hvTech,
    });
    expect(ok.id).toBeTruthy();
  });

  it("starts work: converts the appointment into a job card", async () => {
    const { vehicleId, stdBay, stdTech } = await setup();
    const appt = await createServiceAppointment({
      ...base(vehicleId),
      isHV: false,
      bayId: stdBay,
      technicianId: stdTech,
    });
    const { jobCardId, jobCardName } = await startServiceAppointment(appt.id);
    expect(jobCardName).toMatch(/^JOB-\d{4}-\d{5}$/);

    const a = await getServiceAppointment(appt.id);
    expect(a?.status).toBe("CONVERTED");
    expect(a?.jobCardId).toBe(jobCardId);

    const job = await prisma.jobCard.findUnique({ where: { id: jobCardId } });
    expect(job?.status).toBe("OPEN");
    expect(job?.vehicleId).toBe(vehicleId);
    expect(job?.technicianId).toBe(stdTech);
    expect(job?.bayId).toBe(stdBay);
    expect(job?.technician).toBe("Std Tech"); // free-text mirror carried over
  });

  it("guards the lifecycle: can't start or convert twice, can't delete converted", async () => {
    const { vehicleId } = await setup();
    const appt = await createServiceAppointment(base(vehicleId));
    await startServiceAppointment(appt.id);
    await expect(startServiceAppointment(appt.id)).rejects.toThrow(/booked/i);
    await expect(deleteServiceAppointment(appt.id)).rejects.toThrow(
      /converted/i,
    );
  });

  it("cancels a booked appointment and blocks starting it", async () => {
    const { vehicleId } = await setup();
    const appt = await createServiceAppointment(base(vehicleId));
    await cancelServiceAppointment(appt.id);
    expect((await getServiceAppointment(appt.id))?.status).toBe("CANCELLED");
    await expect(startServiceAppointment(appt.id)).rejects.toThrow(/booked/i);
  });
});

describe("service & workshop — job card QC", () => {
  beforeEach(resetDb);

  it("records a QC sign-off on an open job card", async () => {
    const vehicle = await makeVehicle("VIN-QC");
    const job = await createJobCard({
      vehicleId: vehicle.id,
      warehouseId: "",
      complaint: "x",
      parts: [],
      labor: [],
      photos: [],
    });
    await recordJobCardQc(job.id, { qcBy: "Inspector A", qcNote: "All good" });
    const row = await prisma.jobCard.findUnique({ where: { id: job.id } });
    expect(row?.qcBy).toBe("Inspector A");
    expect(row?.qcNote).toBe("All good");
    expect(row?.qcAt).not.toBeNull();
  });
});
