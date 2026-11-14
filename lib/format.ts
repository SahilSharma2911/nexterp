export function fmtQty(v: number | string | null | undefined) {
  if (v === null || v === undefined) return "—";
  return Number(v).toLocaleString("en-IN", { maximumFractionDigits: 3 });
}

export function fmtMoney(v: number | string | null | undefined) {
  if (v === null || v === undefined) return "—";
  return "₹" + Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtRate(v: number | string | null | undefined) {
  if (v === null || v === undefined) return "—";
  return "₹" + Number(v).toLocaleString("en-IN", { maximumFractionDigits: 6 });
}

export function fmtDateTime(v: string | Date | null | undefined) {
  if (!v) return "—";
  const d = new Date(v);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
