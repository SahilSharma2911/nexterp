import Link from "next/link";
import * as React from "react";

export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/* ---- Page header (ERPNext form/list title bar) ---- */
export function PageHeader({
  title, subtitle, children,
}: {
  title: string; subtitle?: string; children?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-gray-200 pb-3">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/* ---- Button ---- */
type BtnVariant = "primary" | "default" | "ghost" | "danger";
const btnCls: Record<BtnVariant, string> = {
  primary: "bg-gray-900 text-white hover:bg-gray-800",
  default: "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50",
  ghost: "text-gray-600 hover:bg-gray-100",
  danger: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
};
export function Button({
  variant = "default", className, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return <button className={cn("inline-flex h-8 items-center rounded-md px-3 text-sm font-medium transition disabled:opacity-50", btnCls[variant], className)} {...props} />;
}
export function LinkButton({
  href, variant = "default", className, children,
}: {
  href: string; variant?: BtnVariant; className?: string; children: React.ReactNode;
}) {
  return <Link href={href} className={cn("inline-flex h-8 items-center rounded-md px-3 text-sm font-medium transition", btnCls[variant], className)}>{children}</Link>;
}

/* ---- Inputs ---- */
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("h-8 w-full rounded-md border border-gray-300 bg-white px-2.5 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10", props.className)} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn("h-8 w-full rounded-md border border-gray-300 bg-white px-2 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10", props.className)} />;
}
export function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-gray-500">{label}{required && <span className="text-red-500"> *</span>}</span>
      {children}
    </label>
  );
}

/* ---- Table ---- */
export function Table({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto rounded-md border border-gray-200 bg-white"><table className="w-full text-sm">{children}</table></div>;
}
export function Th({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <th className={cn("border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500", className)}>{children}</th>;
}
export function Td({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <td className={cn("border-b border-gray-100 px-3 py-2 align-middle text-gray-800", className)}>{children}</td>;
}

/* ---- Status pill ---- */
export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    SUBMITTED: "bg-blue-50 text-blue-700",
    CANCELLED: "bg-red-50 text-red-600",
  };
  const label = status.charAt(0) + status.slice(1).toLowerCase();
  return <span className={cn("inline-flex rounded px-2 py-0.5 text-xs font-medium", map[status] ?? "bg-gray-100 text-gray-600")}>{label}</span>;
}
