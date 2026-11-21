"use client";

import Link from "next/link";
import { ArrowLeft, Car } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { PageHeader } from "@/components/page-header";
import { NewButton } from "@/components/new-button";
import { Button } from "@/components/ui/button";
import { useVehicle } from "@/modules/dms/vehicles/queries";
import { JobCardsTable } from "./job-cards-table";
import { JobCardAnalytics } from "./job-card-analytics";

export function JobCardsView() {
  const [vehicle, setVehicle] = useQueryState(
    "vehicle",
    parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  );
  const scoped = !!vehicle;
  const { data: v } = useVehicle(scoped ? vehicle : undefined);

  const vehicleLabel = v
    ? [v.vin, [v.model, v.variant].filter(Boolean).join(" ")]
        .filter(Boolean)
        .join(" · ")
    : "this vehicle";

  return (
    <>
      <PageHeader
        title={scoped ? "Service history" : "Job Cards"}
        subtitle={
          scoped
            ? `Workshop jobs for ${vehicleLabel}`
            : "Workshop — parts & labour against a vehicle"
        }
        actions={
          <>
            {scoped && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVehicle(null)}
              >
                <ArrowLeft className="size-4" />
                See all job cards
              </Button>
            )}
            <NewButton
              href={
                scoped
                  ? `/dms/job-cards/new?vehicle=${vehicle}`
                  : "/dms/job-cards/new"
              }
              label="New Job Card"
              area="dms"
            />
          </>
        }
      />

      <div className="space-y-6">
        {scoped ? (
          v && (
            <Link
              href={`/dms/vehicles/${vehicle}`}
              className="inline-flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm hover:bg-muted"
            >
              <Car className="size-4 text-muted-foreground" />
              <span className="font-medium">{vehicleLabel}</span>
              <span className="text-muted-foreground">· open vehicle →</span>
            </Link>
          )
        ) : (
          <JobCardAnalytics />
        )}
        <JobCardsTable />
      </div>
    </>
  );
}
