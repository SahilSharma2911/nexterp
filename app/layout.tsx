import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "nexterp",
  description: "A generic ERP (ERPNext-modeled) on Next.js",
};

// Set the saved accent before paint to avoid a flash of the wrong colour.
const accentScript = `try{var a=localStorage.getItem('accent')||'blue';if(a&&a!=='neutral')document.documentElement.setAttribute('data-accent',a);}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased", "font-sans")}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: accentScript }} />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
