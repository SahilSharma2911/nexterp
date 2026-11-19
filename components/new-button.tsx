"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCanWrite } from "@/components/session-context";
import type { Area } from "@/lib/permissions";

// Primary "create" action for a list page — lives in the PageHeader (top),
// gated by write permission for the area. Renders nothing for read-only users.
export function NewButton({
  href,
  label,
  area,
}: {
  href: string;
  label: string;
  area: Area;
}) {
  const canWrite = useCanWrite(area);
  if (!canWrite) return null;
  return (
    <Button asChild size="sm">
      <Link href={href}>
        <Plus className="size-4" />
        {label}
      </Link>
    </Button>
  );
}
