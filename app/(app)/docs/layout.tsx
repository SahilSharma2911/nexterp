import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DocsNav } from "@/features/docs/docs-nav";

export const metadata = { title: "Docs · Seeka Motor" };

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <Link
          href="/"
          className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to app
        </Link>
        <DocsNav />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
