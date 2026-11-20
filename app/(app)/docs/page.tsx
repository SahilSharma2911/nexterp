import Link from "next/link";
import { docsByArea } from "@/features/docs/content";

export const metadata = { title: "Docs · nexterp" };

export default function DocsHome() {
  const groups = docsByArea();

  return (
    <article className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Documentation</h1>
        <p className="mt-2 text-muted-foreground">
          What each part of nexterp does, in plain English, and how it all fits
          together.
        </p>
      </header>

      <section>
        <h2 className="text-base font-semibold">How it all fits together</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          nexterp runs your business as a chain of connected documents. A
          typical loop looks like this:
        </p>
        <ol className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">1. Set up</span> your{" "}
            <Link href="/docs/items" className="text-primary hover:underline">Items</Link>{" "}
            (what) and{" "}
            <Link href="/docs/warehouses" className="text-primary hover:underline">Warehouses</Link>{" "}
            (where).
          </li>
          <li>
            <span className="font-medium text-foreground">2. Buy</span> — a{" "}
            <Link href="/docs/purchase-order" className="text-primary hover:underline">Purchase Order</Link>{" "}
            then a{" "}
            <Link href="/docs/purchase-receipt" className="text-primary hover:underline">Purchase Receipt</Link>{" "}
            (stock goes up).
          </li>
          <li>
            <span className="font-medium text-foreground">3. Make</span> (optional) — a{" "}
            <Link href="/docs/bom" className="text-primary hover:underline">BOM</Link>{" "}
            then a{" "}
            <Link href="/docs/work-order" className="text-primary hover:underline">Work Order</Link>.
          </li>
          <li>
            <span className="font-medium text-foreground">4. Sell</span> — a{" "}
            <Link href="/docs/sales-order" className="text-primary hover:underline">Sales Order</Link>{" "}
            then a{" "}
            <Link href="/docs/delivery-note" className="text-primary hover:underline">Delivery Note</Link>{" "}
            (stock goes down).
          </li>
        </ol>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Anything that moves stock writes to the{" "}
          <Link href="/docs/stock-ledger" className="text-primary hover:underline">Stock Ledger</Link>,
          and the balance reports just summarise it.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold">On the EV dealership side</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          The{" "}
          <Link href="/docs/dealership" className="text-primary hover:underline">
            Dealership
          </Link>{" "}
          module adds EV-specific flows on top of the ERP: each{" "}
          <Link href="/docs/vehicles" className="text-primary hover:underline">
            Vehicle
          </Link>{" "}
          is sold once through its lifecycle (and delivery posts to the ledger),
          then serviced many times — booked as{" "}
          <Link
            href="/docs/service-appointments"
            className="text-primary hover:underline"
          >
            Service Appointments
          </Link>{" "}
          (assigning a bay + technician) that become{" "}
          <Link href="/docs/job-cards" className="text-primary hover:underline">
            Job Cards
          </Link>
          , with{" "}
          <Link href="/docs/warranties" className="text-primary hover:underline">
            Warranties
          </Link>{" "}
          and{" "}
          <Link href="/docs/subsidy" className="text-primary hover:underline">
            EV subsidies
          </Link>{" "}
          tracked alongside. New to it? Start with{" "}
          <Link href="/docs/dealership" className="text-primary hover:underline">
            Dealership — start here
          </Link>
          .
        </p>
      </section>

      {groups.map((g) => (
        <section key={g.area}>
          <h2 className="text-base font-semibold">{g.area}</h2>
          <ul className="mt-2 divide-y rounded-lg border">
            {g.docs.map((d) => (
              <li key={d.slug}>
                <Link
                  href={`/docs/${d.slug}`}
                  className="flex flex-col gap-0.5 px-4 py-2.5 transition-colors hover:bg-accent"
                >
                  <span className="text-sm font-medium">{d.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {d.summary}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  );
}
