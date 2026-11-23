import { prisma } from "@/lib/prisma";
import type { WarrantyInsights } from "@/modules/dms/warranties/schema";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const NOMINAL_BATTERY_CLAIM = 150_000; // fallback liability per at-risk battery

// EV-specific warranty analytics: claim frequency by model/dealer, rejection
// rate, top fault codes, cost forecast, and a battery-SoH fleet liability view.
export async function warrantyInsights(): Promise<WarrantyInsights> {
  const [claims, batteryWarranties, batteryClaims, fleet] = await Promise.all([
    prisma.warrantyClaim.findMany({
      select: {
        status: true,
        faultCode: true,
        claimAmount: true,
        approvedAmount: true,
        claimDate: true,
        warranty: {
          select: {
            vehicle: { select: { model: true, dealer: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.warranty.findMany({
      where: { component: "BATTERY", status: "ACTIVE" },
      select: { soHThreshold: true, vehicle: { select: { batterySoH: true } } },
    }),
    prisma.warrantyClaim.findMany({
      where: {
        status: { in: ["APPROVED", "SETTLED"] },
        warranty: { component: "BATTERY" },
      },
      select: { approvedAmount: true },
    }),
    prisma.vehicle.findMany({
      where: { batterySoH: { not: null } },
      select: { batterySoH: true },
    }),
  ]);

  const total = claims.length;
  const decided = claims.filter((c) =>
    ["APPROVED", "REJECTED", "SETTLED"].includes(c.status),
  ).length;
  const rejected = claims.filter((c) => c.status === "REJECTED").length;
  const approved = claims.filter((c) =>
    ["APPROVED", "SETTLED"].includes(c.status),
  ).length;

  const tally = (key: (c: (typeof claims)[number]) => string | null) => {
    const m = new Map<string, number>();
    for (const c of claims) {
      const k = key(c);
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  // Cost per month (claimed value) over the last 6 months + a simple forecast.
  const now = new Date();
  const months: { key: string; name: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      name: d.toLocaleDateString("en-IN", { month: "short" }),
      value: 0,
    });
  }
  for (const c of claims) {
    const d = c.claimDate;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const m = months.find((x) => x.key === key);
    if (m) m.value = round2(m.value + Number(c.claimAmount));
  }
  // Forecast = average of the last 3 months with any activity.
  const last3 = months.slice(-3).map((m) => m.value);
  const costForecast = round2(last3.reduce((s, v) => s + v, 0) / 3);

  // Battery fleet SoH distribution + at-risk liability.
  const soHs = fleet.map((v) => v.batterySoH as number);
  const avgSoH = soHs.length
    ? round2(soHs.reduce((s, v) => s + v, 0) / soHs.length)
    : 0;
  const buckets = [
    { name: "≥ 90%", lo: 90, hi: Infinity },
    { name: "80–89%", lo: 80, hi: 89.9999 },
    { name: "70–79%", lo: 70, hi: 79.9999 },
    { name: "< 70%", lo: -Infinity, hi: 69.9999 },
  ].map((b) => ({
    name: b.name,
    value: soHs.filter((s) => s >= b.lo && s <= b.hi).length,
  }));

  const atRisk = batteryWarranties.filter((w) => {
    const soh = w.vehicle.batterySoH;
    return soh != null && soh < (w.soHThreshold ?? 70);
  }).length;
  const avgBatteryClaim = batteryClaims.length
    ? round2(
        batteryClaims.reduce((s, c) => s + Number(c.approvedAmount), 0) /
          batteryClaims.length,
      )
    : NOMINAL_BATTERY_CLAIM;

  return {
    totalClaims: total,
    rejectionRate: decided ? round2((rejected / decided) * 100) : 0,
    approvalRate: decided ? round2((approved / decided) * 100) : 0,
    avgClaimValue: total
      ? round2(claims.reduce((s, c) => s + Number(c.claimAmount), 0) / total)
      : 0,
    claimsByModel: tally((c) => c.warranty.vehicle.model).slice(0, 8),
    claimsByDealer: tally((c) => c.warranty.vehicle.dealer?.name ?? null).slice(0, 8),
    topFaultCodes: tally((c) => c.faultCode).slice(0, 8),
    costMonthly: months.map((m) => ({ name: m.name, value: m.value })),
    costForecast,
    battery: {
      buckets,
      atRisk,
      avgSoH,
      estimatedLiability: round2(atRisk * avgBatteryClaim),
    },
  };
}
