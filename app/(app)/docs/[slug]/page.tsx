import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOCS, getDoc } from "@/features/docs/content";

export function generateStaticParams() {
  return DOCS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const doc = getDoc(slug);
  return { title: doc ? `${doc.title} · Docs · nexterp` : "Docs · nexterp" };
}

export default async function DocPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const doc = getDoc(slug);
  if (!doc) notFound();

  const i = DOCS.findIndex((d) => d.slug === slug);
  const prev = i > 0 ? DOCS[i - 1] : null;
  const next = i < DOCS.length - 1 ? DOCS[i + 1] : null;

  return (
    <article className="space-y-8">
      <header>
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {doc.area}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {doc.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{doc.summary}</p>
        {doc.open && (
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href={doc.open}>
              Open {doc.title}
              <ExternalLink className="size-3.5" />
            </Link>
          </Button>
        )}
      </header>

      <div className="space-y-6">
        {doc.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-base font-semibold">{s.heading}</h2>
            {s.body?.map((p, idx) => (
              <p
                key={idx}
                className="mt-2 text-sm leading-relaxed text-muted-foreground"
              >
                {p}
              </p>
            ))}
            {s.list && (
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
                {s.list.map((li, idx) => (
                  <li key={idx}>{li}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <nav className="flex items-center justify-between gap-3 border-t pt-4 text-sm">
        {prev ? (
          <Link
            href={`/docs/${prev.slug}`}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/docs/${next.slug}`}
            className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            {next.title} <ArrowRight className="size-3.5" />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
